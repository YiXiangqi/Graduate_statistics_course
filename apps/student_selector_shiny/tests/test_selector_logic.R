args <- commandArgs(trailingOnly = FALSE)
file_arg <- args[grep("^--file=", args)]
script_path <- normalizePath(sub("^--file=", "", file_arg), mustWork = TRUE)
script_dir <- dirname(script_path)
source(file.path(script_dir, "..", "R", "selector_logic.R"))

assert_equal <- function(actual, expected, message) {
  if (!identical(actual, expected)) {
    stop(sprintf("%s\nExpected: %s\nActual: %s", message, toString(expected), toString(actual)))
  }
}

test_parse_students_text <- function() {
  input <- " Alice\n\nBob \n Alice\n  Carol  "
  actual <- parse_students_text(input)
  expected <- c("Alice", "Bob", "Carol")
  assert_equal(actual, expected, "parse_students_text should trim, drop blanks, and deduplicate")
}

test_draw_next_student_fair_rotation <- function() {
  students <- c("Alice", "Bob", "Carol")
  state <- list(pool = students, history = character(0), selected = NULL)
  picks <- character(0)

  for (i in seq_len(3)) {
    result <- draw_next_student(state, students)
    picks <- c(picks, result$selected)
    state <- result$state
  }

  assert_equal(length(unique(picks)), 3L, "draw_next_student should not repeat before full cycle")
  assert_equal(sort(picks), sort(students), "draw_next_student should pick all students in first cycle")
}

test_reset_selector_state <- function() {
  students <- c("Alice", "Bob")
  state <- list(pool = "Bob", history = c("Alice", "Bob"), selected = "Alice")
  reset <- reset_selector_state(students)

  assert_equal(reset$pool, students, "reset should restore full pool")
  assert_equal(reset$history, character(0), "reset should clear history")
  if (!is.null(reset$selected)) {
    stop("reset should clear selected student")
  }
}

run_all_tests <- function() {
  test_parse_students_text()
  test_draw_next_student_fair_rotation()
  test_reset_selector_state()
  message("All tests passed")
}

run_all_tests()
