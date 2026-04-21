args <- commandArgs(trailingOnly = FALSE)
file_arg <- args[grep("^--file=", args)]
script_path <- normalizePath(sub("^--file=", "", file_arg), mustWork = TRUE)
script_dir <- dirname(script_path)

source(file.path(script_dir, "..", "R", "display_mode.R"))

assert_true <- function(value, message) {
  if (!isTRUE(value)) {
    stop(message)
  }
}

assert_equal <- function(actual, expected, message) {
  if (!identical(actual, expected)) {
    stop(sprintf("%s\nExpected: %s\nActual: %s", message, toString(expected), toString(actual)))
  }
}

test_big_screen_css_increases_selected_font <- function() {
  normal_css <- get_mode_css(FALSE)
  big_css <- get_mode_css(TRUE)

  assert_true(grepl("selected-student.*48px", normal_css), "normal mode selected font size should be 48px")
  assert_true(grepl("selected-student.*72px", big_css), "big-screen mode selected font size should be 72px")
}

test_big_screen_hides_title_and_nonessential_sections <- function() {
  big_css <- get_mode_css(TRUE)

  assert_true(grepl("#app_title.*none", big_css), "big-screen mode should hide title")
  assert_true(grepl("#list_column.*none", big_css), "big-screen mode should hide student list")
  assert_true(grepl("#history_section.*none", big_css), "big-screen mode should hide history section")
  assert_true(grepl("#controls_container.*position: fixed", big_css), "big-screen mode should pin controls near top")
}

test_dashboard_variables_exist <- function() {
  normal_css <- get_mode_css(FALSE)

  assert_true(grepl("--accent", normal_css), "dashboard CSS should define accent variable")
  assert_true(grepl("dashboard-card", normal_css), "dashboard CSS should style dashboard cards")
}

test_mode_button_label <- function() {
  assert_equal(get_mode_button_label(FALSE), "开启课堂大屏模式", "normal mode button label should invite enable")
  assert_equal(get_mode_button_label(TRUE), "关闭课堂大屏模式", "big-screen mode button label should invite disable")
}

run_all_tests <- function() {
  test_big_screen_css_increases_selected_font()
  test_big_screen_hides_title_and_nonessential_sections()
  test_dashboard_variables_exist()
  test_mode_button_label()
  message("All tests passed")
}

run_all_tests()
