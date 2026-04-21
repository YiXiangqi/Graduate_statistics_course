parse_students_text <- function(text) {
  lines <- unlist(strsplit(text, "\n", fixed = TRUE), use.names = FALSE)
  students <- trimws(lines)
  students <- students[students != ""]
  unique(students)
}

initialize_selector_state <- function(students) {
  list(
    pool = students,
    history = character(0),
    selected = NULL
  )
}

draw_next_student <- function(state, students) {
  if (length(students) == 0) {
    return(list(
      selected = NULL,
      state = list(pool = character(0), history = state$history, selected = NULL)
    ))
  }

  pool <- state$pool
  if (length(pool) == 0) {
    pool <- students
  }

  selected <- sample(pool, size = 1)
  updated_pool <- pool[pool != selected]
  updated_history <- c(state$history, selected)

  list(
    selected = selected,
    state = list(pool = updated_pool, history = updated_history, selected = selected)
  )
}

reset_selector_state <- function(students) {
  list(pool = students, history = character(0), selected = NULL)
}
