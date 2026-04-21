get_mode_css <- function(big_screen = FALSE) {
  if (isTRUE(big_screen)) {
    return(paste(
      ":root {",
      "  --bg: #f3f4f6;",
      "  --panel: #ffffff;",
      "  --panel-weak: #eef0f3;",
      "  --text-main: #1f2937;",
      "  --text-subtle: #6b7280;",
      "  --accent: #d97706;",
      "  --accent-contrast: #ffffff;",
      "  --border: #d1d5db;",
      "  --shadow: 0 10px 24px rgba(17, 24, 39, 0.12);",
      "  --radius: 18px;",
      "}",
      "body { font-size: 28px; background: linear-gradient(160deg, #f5f6f8 0%, #eceff3 100%); color: var(--text-main); }",
      ".btn { font-size: 28px; border-radius: 12px; padding: 10px 20px; border: 1px solid var(--border); }",
      ".btn-primary { background-color: var(--accent); border-color: var(--accent); color: var(--accent-contrast); }",
      ".btn-warning, .btn-default { background-color: #ffffff; color: var(--text-main); border-color: var(--border); }",
      ".btn:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(31, 41, 55, 0.12); transition: all 160ms ease; }",
      ".form-control { font-size: 24px; border-radius: 12px; border: 1px solid var(--border); }",
      ".shiny-notification { font-size: 22px; border-radius: 10px; border: 1px solid var(--border); }",
      "#app_title { display: none; }",
      "#list_column { display: none; }",
      "#history_section { display: none; }",
      "#main_column { width: 100%; }",
      "#main_column { min-height: calc(100vh - 140px); display: flex; flex-direction: column; align-items: center; justify-content: center; }",
      "#top_divider { display: none; }",
      "#selected_title { text-align: center; font-size: 36px; font-weight: 700; color: var(--text-subtle); letter-spacing: 1px; }",
      "#selected_card_wrap { text-align: center; margin-bottom: 28px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px 40px; min-width: min(85vw, 980px); }",
      "#controls_container { text-align: center; }",
      "#controls_container .btn { margin-right: 12px; }",
      "#controls_container { margin-top: 12px; position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 1000; }",
      "#selected_title { order: 1; }",
      "#selected_card_wrap { order: 2; }",
      "#controls_container { order: 3; }",
      "#status_bar { position: fixed; bottom: 8px; left: 50%; transform: translateX(-50%); color: var(--text-subtle); font-size: 20px; letter-spacing: 0.4px; }",
      ".selected-student { font-size: 72px; font-weight: 800; color: var(--accent); animation: reveal-pick 240ms ease-out; }",
      ".empty-selected { font-size: 52px; color: var(--text-subtle); }",
      "@keyframes reveal-pick { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }",
      sep = "\n"
    ))
  }

  paste(
    ":root {",
    "  --bg: #f3f4f6;",
    "  --panel: #ffffff;",
    "  --panel-weak: #eef0f3;",
    "  --text-main: #1f2937;",
    "  --text-subtle: #6b7280;",
    "  --accent: #d97706;",
    "  --accent-contrast: #ffffff;",
    "  --border: #d1d5db;",
    "  --shadow: 0 10px 24px rgba(17, 24, 39, 0.08);",
    "  --radius: 14px;",
    "}",
    "body { font-size: 20px; background: linear-gradient(160deg, #f5f6f8 0%, #eceff3 100%); color: var(--text-main); }",
    ".btn { font-size: 20px; border-radius: 10px; border: 1px solid var(--border); padding: 8px 16px; }",
    ".btn-primary { background-color: var(--accent); border-color: var(--accent); color: var(--accent-contrast); }",
    ".btn-warning, .btn-default { background-color: #ffffff; color: var(--text-main); border-color: var(--border); }",
    ".btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31, 41, 55, 0.10); transition: all 160ms ease; }",
    ".form-control { font-size: 18px; border-radius: 10px; border: 1px solid var(--border); }",
    ".shiny-notification { font-size: 18px; border-radius: 10px; border: 1px solid var(--border); }",
    ".dashboard-card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 18px; }",
    "#controls_container { background: var(--panel-weak); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px; }",
    "#selected_card_wrap { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; }",
    "#status_bar { margin-top: 10px; color: var(--text-subtle); font-size: 15px; }",
    "#app_title { display: block; }",
    "#list_column { display: block; }",
    "#history_section { display: block; }",
    "#main_column { width: 66.66666667%; display: block; }",
    "#selected_title { text-align: left; font-size: 24px; }",
    "#selected_card_wrap { text-align: left; margin-bottom: 0; }",
    "#controls_container { text-align: left; margin-top: 0; position: static; transform: none; }",
    ".selected-student { font-size: 48px; font-weight: 800; color: var(--accent); animation: reveal-pick 220ms ease-out; }",
    ".empty-selected { font-size: 32px; color: var(--text-subtle); }",
    "@keyframes reveal-pick { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }",
    sep = "\n"
  )
}

get_mode_button_label <- function(big_screen = FALSE) {
  if (isTRUE(big_screen)) {
    return("关闭课堂大屏模式")
  }
  "开启课堂大屏模式"
}
