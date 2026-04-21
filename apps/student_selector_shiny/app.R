library(shiny)

source(file.path("R", "selector_logic.R"))
source(file.path("R", "display_mode.R"))

default_students <- paste(
  c(
    "赵一鸣",
    "袁淼",
    "徐真真",
    "张嘉露",
    "曾子萌",
    "邓长鋆",
    "吴剑",
    "陈鑫",
    "张含",
    "王子翔",
    "许鑫鑫"
  ),
  collapse = "\n"
)

ui <- fluidPage(
  tags$head(tags$style(id = "dynamic-mode-style")),
  div(id = "app_title", titlePanel("随机点名助手")),
  fluidRow(
    column(
      id = "list_column",
      class = "dashboard-card",
      width = 4,
      h4("学生名单"),
      helpText("每行输入一位学生姓名，可随时手动修改。"),
      textAreaInput(
        inputId = "students_text",
        label = NULL,
        value = default_students,
        rows = 16,
        width = "100%"
      ),
      helpText("公平轮转：每位同学被抽到一次前不会重复。")
    ),
    column(
      id = "main_column",
      width = 8,
      fluidRow(
        column(
          width = 12,
          id = "controls_container",
          actionButton("draw_btn", "开始抽取", class = "btn-primary"),
          actionButton("reset_btn", "重置", class = "btn-warning"),
          actionButton("mode_btn", "开启课堂大屏模式", class = "btn-default")
        )
      ),
      tags$hr(id = "top_divider"),
      h4("本次被抽中", id = "selected_title"),
      div(id = "selected_card_wrap", uiOutput("selected_student_card")),
      div(id = "history_section", class = "dashboard-card", tags$hr(), h4("最近抽取记录"), uiOutput("history_list")),
      div(id = "status_bar", uiOutput("status_text"))
    )
  )
)

server <- function(input, output, session) {
  initial_students <- parse_students_text(default_students)
  rv <- reactiveValues(state = initialize_selector_state(initial_students))
  display_mode <- reactiveVal(FALSE)

  observe({
    session$sendCustomMessage(
      "update-style",
      list(css = get_mode_css(display_mode()))
    )
  })

  observeEvent(input$mode_btn, {
    display_mode(!display_mode())
    updateActionButton(session, "mode_btn", label = get_mode_button_label(display_mode()))
  })

  observeEvent(input$draw_btn, {
    students <- parse_students_text(input$students_text)

    if (length(students) == 0) {
      showNotification("名单为空，请至少输入一位学生姓名。", type = "error")
      return()
    }

    if (!all(rv$state$pool %in% students)) {
      rv$state$pool <- students
    }

    result <- draw_next_student(rv$state, students)
    rv$state <- result$state
  })

  observeEvent(input$reset_btn, {
    students <- parse_students_text(input$students_text)
    rv$state <- reset_selector_state(students)
    showNotification("已重置轮转池和历史记录。", type = "message")
  })

  output$selected_student_card <- renderUI({
    selected <- rv$state$selected
    if (is.null(selected)) {
      return(tags$div(class = "empty-selected", "尚未抽取学生。"))
    }
    tags$div(class = "selected-student", selected)
  })

  output$history_list <- renderUI({
    history <- rv$state$history
    if (length(history) == 0) {
      return(tags$div(style = "color: #666;", "暂无历史记录。"))
    }

    recent <- rev(tail(history, 10))
    tags$ol(lapply(recent, tags$li))
  })

  output$status_text <- renderUI({
    students <- parse_students_text(input$students_text)
    if (length(students) == 0) {
      return(tags$span("当前名单为空"))
    }

    remaining <- length(rv$state$pool)
    if (remaining == 0) {
      remaining <- length(students)
    }

    tags$span(sprintf("本轮剩余未抽取：%d 人", remaining))
  })
}

js_code <- "
Shiny.addCustomMessageHandler('update-style', function(message) {
  var styleNode = document.getElementById('dynamic-mode-style');
  if (styleNode) {
    styleNode.textContent = message.css;
  }
});
"

ui <- tagList(ui, tags$script(HTML(js_code)))

shinyApp(ui = ui, server = server)
