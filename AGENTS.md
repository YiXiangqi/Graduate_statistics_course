# AGENTS.md — Graduate Statistics Course

## Quarto conventions

- Talks: `slides/talkNN/talkNN.qmd` (revealjs), homework: `slides/talkNN/homeworkNN.qmd` (HTML)
- Slides: `##` = new slide, `#` = section divider
- Chunk options: hash-pipe syntax (`#|`), defaults in YAML `execute:` block — no `knitr::opts_chunk$set()`
- YAML header template:
  ```yaml
  format:
    revealjs:
      slide-number: true
      scrollable: true
      df-print: default
  execute:
    echo: true
    warning: false
    message: false
    fig-align: "center"
  ```
- Incremental lists: `::: incremental` / `:::`
- Math: `$...$` inline, `$$...$$` display
- Tabbed panels: `::: {.panel-tabset}` / `### Tab name` / content / `:::`

## R code style

- `|>` not `%>%`, `lower_snake_case`, `tidyverse`-first
- Chinese text in plots → use `showtext`:
  ```r
  library(showtext)
  font_add("PingFang SC", regular = "<path-to>/PingFang.ttc")
  font_add("TNR", regular = "<path-to>/Times New Roman.ttf")
  showtext_auto()
  theme_set(theme_light(base_size = 16, base_family = "PingFang SC") + ...)
  ```
  Find font paths: `systemfonts::match_fonts("PingFang SC")$path`
- No `dev: ragg_png` with showtext; no `expression()` in labels

## .Rmd → .qmd conversion checklist

When adapting ioslides `.Rmd` to revealjs `.qmd`:

1. Replace YAML header with Quarto `format: revealjs:` block
2. `%>%` → `|>` throughout
3. `<div style="...">` → `::: {style="..."}` fenced divs
4. `<div align="center"><img ...>` → `::: {style="text-align: center;"} ![](images/...){width="NN%"} :::`
5. Remove `knitr::opts_chunk$set()`, rely on YAML `execute:` defaults
6. Add `showtext` setup if plots contain Chinese text
7. Add `#| fig-align: center` to every plot-producing chunk
8. Fix data paths: `Data/...` → `data/`

## After editing: render + validate

```bash
bash scripts/render_and_check.sh talkNN
```
Prerequisite: `npm install` (puppeteer-core).

- **0 FAILs required**; WARNs acceptable for `scrollable: true` talks
- **Slide numbers** in validator output match the rendered HTML — use these when user says "slide N"
- **R3 (image centering)**: auto-fix covers R chunks only. Markdown `![]()` images need manual fix

## Homework solutions

```yaml
params:
  show_solutions: false
```
Wrap solutions: `::: {.content-visible when-meta="show_solutions"}` ... `:::`
