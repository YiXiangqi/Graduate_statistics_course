#!/usr/bin/env node
// scripts/validate_slides.js
// Usage:
//   node scripts/validate_slides.js slides/talkNN/talkNN.html
//   node scripts/validate_slides.js slides/talkNN/talkNN.html --qmd slides/talkNN/talkNN.qmd
//   node scripts/validate_slides.js slides/talkNN/talkNN.html --slides "1,5,12"

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(m) { console.error(' ', m); }
function die(m) { console.error('ERROR:', m); process.exit(1); }

// ─── QMD: auto-fix #| fig-align: center ───
function autoFixCentering(qmdPath, slideTitle) {
  const raw = fs.readFileSync(qmdPath, 'utf-8');
  const lines = raw.split('\n');
  let headingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)/);
    if (m && m[1].trim() === slideTitle) { headingIdx = i; break; }
  }
  if (headingIdx === -1) { log(`R3: heading "${slideTitle}" not found in qmd`); return false; }

  // Find first code block after heading (before next ## or end)
  let chunkStart = -1;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break;
    if (lines[i].startsWith('```') && chunkStart === -1) chunkStart = i;
    else if (lines[i].startsWith('```') && chunkStart >= 0) break;
  }
  if (chunkStart === -1) { log(`R3: no code chunk after "${slideTitle}"`); return false; }

  const optEnd = chunkStart + 1;
  let i = optEnd;
  while (i < lines.length && lines[i].startsWith('#|')) i++;
  const optsEnd = i;

  const existing = lines.slice(optEnd, optsEnd).some(l => /^#\| fig-align/.test(l));
  if (existing) { log(`R3: fig-align already set in chunk at line ${chunkStart + 1}`); return true; }

  lines.splice(optsEnd, 0, '#| fig-align: center');
  fs.writeFileSync(qmdPath, lines.join('\n'), 'utf-8');
  log(`R3: auto-fixed ${qmdPath}:${chunkStart + 1} — added #| fig-align: center`);
  return true;
}

// ─── GIT: detect changed slide titles ───
function detectChangedSlides(qmdPath) {
  const absPath = path.resolve(qmdPath);
  if (!fs.existsSync(absPath)) return null;
  let repoRoot;
  try { repoRoot = execSync('git rev-parse --show-toplevel', { cwd: path.dirname(absPath), encoding:'utf-8' }).trim(); }
  catch { return null; }
  const relPath = path.relative(repoRoot, absPath);
  let diff;
  try { diff = execSync(`git diff HEAD -- "${relPath}"`, { cwd: repoRoot, encoding:'utf-8' }); }
  catch { return null; }
  if (!diff.trim() || diff.startsWith('fatal:')) return null;

  const changedLines = [];
  const re = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/gm;
  let m; while ((m = re.exec(diff)) !== null) changedLines.push(parseInt(m[1]));
  if (changedLines.length === 0) return null;

  const qmdLines = fs.readFileSync(absPath, 'utf-8').split('\n');
  const headings = [];
  qmdLines.forEach((line, i) => {
    if (line.startsWith('## ')) headings.push({ line: i + 1, title: line.replace(/^## /, '').trim() });
  });
  if (headings.length === 0) return null;

  const changedTitles = new Set();
  for (const cl of changedLines) {
    let best = null;
    for (const h of headings) { if (h.line <= cl) best = h; else break; }
    if (best) changedTitles.add(best.title);
  }
  return changedTitles.size > 0 ? Array.from(changedTitles) : null;
}

// ─── PUPPETEER ───
async function launchBrowser() {
  if (!fs.existsSync(CHROME_PATH)) die(`Chrome not found at ${CHROME_PATH}`);
  try { require.resolve('puppeteer-core'); } catch { die('puppeteer-core not installed. Run: npm install'); }
  return puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox'] });
}

// Build nav map: for each sequential slide, its (h, v) indices
async function buildNavMap(page) {
  return page.evaluate(() => {
    const hs = Reveal.getHorizontalSlides();
    const map = [];
    let seq = 0;
    hs.forEach((hEl, hIdx) => {
      const verts = hEl.querySelectorAll(':scope > section');
      if (verts.length > 0) {
        verts.forEach(vEl => { map.push({ idx: seq++, h: hIdx, v: Array.from(verts).indexOf(vEl) }); });
      } else {
        map.push({ idx: seq++, h: hIdx, v: 0 });
      }
    });
    return map;
  });
}

// Extract bounding rects + styles for current slide
async function collectSlideData(page) {
  return page.evaluate(() => {
    const slide = Reveal.getCurrentSlide();
    if (!slide) return null;
    const sr = slide.getBoundingClientRect();
    const children = Array.from(slide.children).map((c, i) => {
      const r = c.getBoundingClientRect();
      const cs = window.getComputedStyle(c);
      return {
        idx: i,
        tag: c.tagName.toLowerCase(),
        class: c.className,
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        centerX: Math.round(r.x + r.width / 2),
        isStretchImg: c.tagName === 'IMG' && (c.classList.contains('r-stretch') || c.classList.contains('stretch')),
        imgNatW: c.tagName === 'IMG' ? c.naturalWidth : 0,
        imgNatH: c.tagName === 'IMG' ? c.naturalHeight : 0,
        display: cs.display,
        innerText: (c.innerText || '').substring(0, 100).replace(/\s+/g, ' '),
      };
    });
    return {
      slideX: Math.round(sr.x), slideY: Math.round(sr.y),
      slideW: Math.round(sr.width), slideH: Math.round(sr.height),
      children,
    };
  });
}

// Wait for all images to finish loading
async function waitImages(page) {
  await page.evaluate(() => Promise.all(
    Array.from(document.images).map(img =>
      img.complete ? Promise.resolve() :
        new Promise(res => { img.onload = res; img.onerror = res; })
    )
  ));
}

// ─── RULES ───
function runRules(data, slide, scrollable) {
  const issues = [];
  const { children, slideW, slideH, slideX, slideY } = data;
  const base = { slide: slide.index, title: slide.title };
  const push = (rule, severity, detail, hint) => issues.push({ ...base, rule, severity, detail, fix_hint: hint, auto_fixed: false });
  const overFlowSeverity = scrollable ? 'warn' : 'fail';

  const blockTags = ['ul', 'ol', 'div', 'p', 'blockquote', 'table'];
  const slideCenterX = slideX + slideW / 2;

  for (const c of children) {
    // R1: img height < 10px
    if (c.tag === 'img' && c.h < 10) {
      push('img_zero_size', 'fail',
        `<img> display ${c.display}, natural ${c.imgNatW}x${c.imgNatH}, rendered ${c.w}x${c.h}`,
        'Reduce content or split slide; use #| echo: false on code chunk');
    }

    // R2: r-stretch img < 15% slide height
    if (c.isStretchImg && c.h > 0 && c.h < slideH * 0.15) {
      push('stretch_too_small', 'warn',
        `r-stretch img ${c.w}x${c.h} (${(c.h / slideH * 100).toFixed(0)}% of slide height, threshold 15%)`,
        'Reduce content or split slide; use #| echo: false');
    }

    // R3: image not horizontally centered
    if ((c.isStretchImg || c.tag === 'img') && c.w < slideW * 0.9) {
      const offset = Math.abs(c.centerX - slideCenterX);
      if (offset > slideW * 0.02) {
        push('image_not_centered', 'warn',
          `img centerX=${c.centerX}, slide centerX=${Math.round(slideCenterX)}, offset=${Math.round(offset)}px (${(offset / slideW * 100).toFixed(1)}%)`,
          `Add #| fig-align: center to the plot chunk in talkXX.qmd`);
      }
    }
  }

  // R5: r-stretch img followed by block content
  for (let i = 0; i < children.length; i++) {
    if (!children[i].isStretchImg) continue;
    for (let j = i + 1; j < children.length; j++) {
      if (blockTags.includes(children[j].tag)) {
        push('stretch_after_content', 'warn',
          `r-stretch img (idx ${i}) followed by <${children[j].tag}> (idx ${j})`,
          'Move content before the image or split slide');
        break;
      }
    }
  }

  // R6: content overflow
  for (const c of children) {
    const ox = c.x < slideX - 1 || c.y < slideY - 1 ||
              c.x + c.w > slideX + slideW + 1 || c.y + c.h > slideY + slideH + 1;
    if (ox) push('content_overflow', overFlowSeverity,
      `<${c.tag}> overflows: (${c.x},${c.y} ${c.w}x${c.h}) vs slide (${slideX},${slideY} ${slideW}x${slideH})`,
      'Split slide or reduce content');
  }

  // R7: element overlap
  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const a = children[i], b = children[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ox > 0 && oy > 0) {
        push('element_overlap', 'warn',
          `<${a.tag}>[${a.idx}] overlaps <${b.tag}>[${b.idx}] : ${ox}x${oy}px`,
          'Check layout; adjust margins or split content');
      }
    }
  }

  return issues;
}

// ─── MAIN ───
async function main() {
  const args = process.argv.slice(2);
  const htmlPath = args.find(a => a.endsWith('.html'));
  if (!htmlPath) die('Usage: node validate_slides.js <talkNN.html> [--qmd <talkNN.qmd>] [--slides "1,3,5"]');

  const htmlAbs = path.resolve(htmlPath);
  if (!fs.existsSync(htmlAbs)) die(`HTML not found: ${htmlAbs}`);
  const htmlDir = path.dirname(htmlAbs);
  const htmlBase = path.basename(htmlAbs, '.html');
  const qmdPath = args.indexOf('--qmd') >= 0 ? args[args.indexOf('--qmd') + 1] : path.join(htmlDir, htmlBase + '.qmd');
  const explicitSlides = args.indexOf('--slides') >= 0
    ? args[args.indexOf('--slides') + 1].split(',').map(s => parseInt(s.trim()))
    : null;
  const verbose = args.includes('--verbose');

  // Detect changes via git
  let changedTitles = null;
  if (!explicitSlides && fs.existsSync(qmdPath)) {
    changedTitles = detectChangedSlides(qmdPath);
    if (changedTitles) log(`git: ${changedTitles.length} slides changed`);
  }

  // Detect scrollable mode from qmd YAML
  let scrollable = false;
  if (fs.existsSync(qmdPath)) {
    const qmdRaw = fs.readFileSync(qmdPath, 'utf-8');
    scrollable = /scrollable\s*:\s*true/.test(qmdRaw);
    if (scrollable) log('Talk is scrollable — content_overflow downgraded to WARN');
  }

  // Launch browser
  log('Launching Chrome ...');
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('file://' + htmlAbs);
  await page.waitForFunction('typeof Reveal !== "undefined" && Reveal.isReady()');
  log('Ready.');

  // Get all slides
  const slidesMeta = await page.evaluate(() =>
    Reveal.getSlides().map((s, i) => {
      const h2 = s.querySelector('h2');
      const h1 = s.querySelector('h1');
      return { index: i + 1, title: (h2 || h1)?.textContent?.trim() || '(no title)' };
    })
  );
  log(`Total slides: ${slidesMeta.length}`);

  // Build nav map
  const navMap = await buildNavMap(page);
  if (navMap.length !== slidesMeta.length) {
    die(`Mismatch: ${slidesMeta.length} slides but ${navMap.length} nav entries`);
  }

  // Determine which slides to check
  let indicesToCheck;
  if (explicitSlides) {
    indicesToCheck = explicitSlides.filter(i => i >= 1 && i <= slidesMeta.length);
    if (indicesToCheck.length === 0) indicesToCheck = null;
  } else if (changedTitles) {
    const idxSet = new Set();
    for (const title of changedTitles) {
      for (const s of slidesMeta) {
        if (s.title === title || s.title.startsWith(title) || title.startsWith(s.title)) idxSet.add(s.index);
      }
    }
    indicesToCheck = idxSet.size > 0 ? Array.from(idxSet).sort((a, b) => a - b) : null;
  }

  if (indicesToCheck) {
    log(`Checking ${indicesToCheck.length} slides: ${indicesToCheck.join(', ')}`);
  } else {
    indicesToCheck = slidesMeta.map(s => s.index);
    log('Checking all slides');
  }

  // Process each slide
  const allIssues = [];
  const imgSrcs = [];

  for (const idx of indicesToCheck) {
    const slide = slidesMeta[idx - 1];
    const nav = navMap[idx - 1];
    if (!nav) continue;

    // Navigate
    await page.evaluate(({h, v}) => { Reveal.slide(h, v); }, { h: nav.h, v: nav.v });
    await sleep(500);
    await waitImages(page);
    await sleep(300);

    // Verify
    const curTitle = await page.evaluate(() => {
      const s = Reveal.getCurrentSlide();
      return (s?.querySelector('h2') || s?.querySelector('h1'))?.textContent?.trim() || '';
    });
    if (!slide.title.includes(curTitle.substring(0, 10)) && !curTitle.includes(slide.title.substring(0, 10))) {
      log(`Slide ${idx}: nav mismatch ("${slide.title}" vs "${curTitle}"), retrying...`);
      await sleep(500);
    }

    const data = await collectSlideData(page);
    if (!data) { log(`Slide ${idx}: no data`); continue; }

    // Run rules
    const issues = runRules(data, slide, scrollable);
    allIssues.push(...issues);

    // Collect image srcs
    for (const c of data.children) {
      if (c.tag === 'img') {
        imgSrcs.push({ slide: idx, title: slide.title, src: null }); // filled below
      }
    }

    // Also check image src for R4
    if (verbose) {
      log(`  Slide ${String(idx).padStart(2)}  ${issues.length > 0 ? `⚠ ${issues.length}` : 'OK'}  ${slide.title}`);
      data.children.forEach(c => log(`      <${c.tag}> x=${c.x} y=${c.y} w=${c.w} h=${c.h} ${c.isStretchImg ? '★r-stretch' : ''} ${c.tag === 'img' ? `(${c.imgNatW}x${c.imgNatH})` : ''}`));
    }
  }

  // ── R4: check image file existence ──
  const existingImgSrcs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.slides img')).map(img => {
      // Navigate to each slide to get src
      return null; // We'll use a different approach: collect from HTML
    })
  );

  // Scan all images from all slides (they share the same _files dir)
  const allImgTags = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.slides img')).map(img => ({
      src: img.getAttribute('src') || img.getAttribute('data-src') || '',
      slideIdx: -1, // unknown from here
    }))
  );
  const seenSrcs = new Set();
  for (const img of allImgTags) {
    if (!img.src || seenSrcs.has(img.src)) continue;
    seenSrcs.add(img.src);
    const imgAbs = path.resolve(htmlDir, img.src);
    if (!fs.existsSync(imgAbs)) {
      allIssues.push({
        slide: 0, title: img.src, rule: 'image_file_missing', severity: 'fail',
        detail: `File not found: ${imgAbs}`,
        fix_hint: 'Re-render the talk',
      });
    }
  }

  // ── R8: showtext check ──
  if (fs.existsSync(qmdPath)) {
    const qmdContent = fs.readFileSync(qmdPath, 'utf-8');
    const hasShowtext = qmdContent.includes('showtext_auto') || qmdContent.includes('font_add');
    const htmlContent = fs.readFileSync(htmlAbs, 'utf-8');
    const hasShowtextInHtml = htmlContent.includes('showtext_auto') || htmlContent.includes('font_add');
    const hasChineseLabel = /['"][^'"]*[\u4e00-\u9fff][^'"]*['"]/.test(qmdContent);

    if (!hasShowtext && !hasShowtextInHtml && hasChineseLabel) {
      allIssues.push({
        slide: 0, title: 'Talk-level', rule: 'missing_showtext', severity: 'warn',
        detail: 'qmd has Chinese text in plot labels but no showtext setup',
        fix_hint: 'Add library(showtext); font_add(...); showtext_auto() in setup chunk',
      });
    }
  }

  // ── R3 auto-fix (centering) ──
  const r3Issues = allIssues.filter(i => i.rule === 'image_not_centered');
  for (const issue of r3Issues) {
    if (fs.existsSync(qmdPath)) {
      issue.auto_fixed = autoFixCentering(qmdPath, issue.title);
    }
  }

  await browser.close();

  // ── Report ──
  const report = {
    talk: htmlBase,
    total_slides: slidesMeta.length,
    checked_slides: indicesToCheck.length,
    issues: allIssues,
    summary: {
      fail: allIssues.filter(i => i.severity === 'fail').length,
      warn: allIssues.filter(i => i.severity === 'warn').length,
      auto_fixed: r3Issues.filter(i => i.auto_fixed).length,
    },
  };
  console.log(JSON.stringify(report, null, 2));

  if (report.summary.fail > 0) process.exit(2);
}

main().catch(e => { die(e.message); });
