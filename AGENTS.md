# AGENTS.md — Graduate Statistics Course

## Repository

Graduate-level statistics course taught in Chinese (高等数据统计分析) by 易湘琦.
Remote: `git@github.com:YiXiangqi/Graduate_statistics_course.git`

## Structure

| Path | What |
|------|------|
| `slides/talkNN/` | `talkNN.qmd` (revealjs slides) + `homeworkNN.qmd` (HTML exercises) |
| `apps/student_selector_shiny/` | Standalone Shiny app (`app.R`, `R/`, `tests/`) |
| `cases/linear_regression/` | Case study |
| `docs/superpowers/plans/` | Talk development plans |
| `docs/superpowers/specs/` | Homework/slide specs for OpenCode |

No CI. No pre-commit hooks. Node.js tools managed via `npm` (package.json at root).

## Tech

- **Language**: R, Quarto (.qmd)
- **R style**: native pipe `|>` (not `%>%`), `lower_snake_case`, `tidyverse`-first
- **Quarto format**: `revealjs` for talks, `html` for homework
- **Key R packages**: `tidyverse`, `patchwork`, `nlme`, `lme4`, `mgcv`, `gstat`, `sp`
- **Rproj defaults**: 2-space tabs, UTF-8

## Workflow

- **Render a talk**: `quarto render slides/talkNN/talkNN.qmd`
- **Render + auto-validate**: `bash scripts/render_and_check.sh talkNN`
- **Render a homework**: `quarto render slides/talkNN/homeworkNN.qmd`
- **Render everything**: `quarto render`
- Rendered `.html` and `*_files/` dirs are committed in-place (some `_files/` dirs gitignored — check `.gitignore`)
- **Slide validation**: `node scripts/validate_slides.js slides/talkNN/talkNN.html`

## Render verification (automated)

After `quarto render`, run the slide checker:

```bash
bash scripts/render_and_check.sh talkNN
```

This launches headless Chrome (via puppeteer-core) and parses the rendered revealjs presentation. It only checks slides that changed (via `git diff` on the `.qmd`).

### Detection rules

| Rule | Checks | Severity | Auto-fix |
|------|--------|----------|----------|
| R1 | `<img>` rendered height < 10px | FAIL | — |
| R2 | `r-stretch` image < 15% of slide height | WARN | — |
| R3 | Image not horizontally centered in slide | WARN | ✓ Adds `#\| fig-align: center` |
| R4 | Image file referenced but missing on disk | FAIL | — |
| R5 | `r-stretch` image followed by block content | WARN | — |
| R6 | Any element overflows slide boundaries | FAIL / WARN¹ | — |
| R7 | Two slide elements overlap | WARN | — |
| R8 | Chinese text in plot but no showtext setup | WARN | — |

¹ `FAIL` for non-scrollable talks; downgraded to `WARN` when `.qmd` YAML declares `scrollable: true`.

### Fix workflow

1. **R3** is auto-fixed in `.qmd` — no action needed
2. **Other issues** — opencode will present each with fix options

### Prerequisites

```bash
npm install   # installs puppeteer-core in project root
```

## Quarto conventions

- Slide headings: level-2 (`##`) = new slide
- Incremental lists: `::: incremental` / `:::` fenced divs (or `{.incremental}` attr)
- Chunk options: hash-pipe syntax (`#|`)
- Chunk defaults: `echo: true`, `warning: false`, `message: false`
- Math: LaTeX inline `$...$` and display `$$...$$`

## Homework solutions pattern

- `show_solutions` param in YAML: `params: show_solutions: false`
- Wrapped in:
  `::: {.content-visible when-meta="show_solutions"}`
  **Solution:** ...
  `:::`

## Chinese / Greek font rendering in plots

macOS default fonts (Helvetica, serif) lack Chinese glyphs. Chinese fonts (PingFang SC, Songti SC) lack Greek letters and arrows (λ, →).

**Fix** — use `showtext` with explicit font registration in the setup chunk:

```r
library(showtext)
font_add("PingFang SC", regular = "<path-to>/PingFang.ttc")
font_add("TNR", regular = "<path-to>/Times New Roman.ttf")
showtext_auto()
```

Then in the theme: `theme_light(base_family = "PingFang SC")`. `showtext` auto-falls back to TNR for glyphs PingFang SC lacks (λ, →, etc.).

On macOS, find font paths via `systemfonts::match_fonts("PingFang SC")$path` and `match_fonts("Times New Roman")$path`.

**Do NOT** use `dev: ragg_png` when showtext is active — they conflict. Use the default `png()` device.

Also: avoid `expression()` in plot labels (may interfere with font rendering); use plain strings with Unicode literals instead (e.g., `"λ 小 → ..."`).

## .gitignore notable entries

```
*.html
*/*/*_cache
slides/talkNN/talkNN_files/
slides/talkNN/homeworkNN_files/
cases/linear_regression/MLR_files
docs/
```

HTML and `_files/` dirs may be tracked (talk05, talk09) or untracked — check before adding.

## Existing instructions

`.github/copilot-instructions.md` contains the same style/formatting rules above. Keep in sync.
