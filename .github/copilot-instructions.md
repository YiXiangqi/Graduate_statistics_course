# .github/copilot-instructions.md

## Repository & Architecture
- **Purpose:** Graduate Statistics course materials.
- **Structure:** `slides/talkNN/` contains `talkNN.qmd` (revealjs slides) and `homeworkNN.qmd` (HTML exercises).
- **Workflow:** Edit `.qmd` sources; rendered `.html` may be committed in-place.
- **Slide validation:** Use `bash scripts/render_and_check.sh talkNN` after rendering.

## Technical Stack
- **Environment:** R, Quarto (.qmd), Node.js (package.json at root for puppeteer-core).
- **R Style:** 
  - Use the native pipe `|>` instead of `%>%`. 
  - `lower_snake_case` for objects/files; avoid dots in names.
- **Libraries:** `tidyverse` (primary), `patchwork`, `nlme`, `lme4`, `mgcv`.
- **Standards:** Graduate-level rigor, tidyverse-first, LaTeX for all math.

## Formatting Rules
- **Syntax:** Use hash-pipe `#|` for chunk options; `:::` fenced divs for layouts.
- **Slides:** Level 2 headings (`##`) for new slides, `.incremental` lists, and `code-line-numbers`.
- **Homework Solutions:** Use a `show_solutions` parameter.
  - Wrap answers in: `::: {.content-visible when-meta="show_solutions"}`
  - Example: 
    ::: {.content-visible when-meta="show_solutions"}
    **Solution:** [R code or explanation]
    :::
