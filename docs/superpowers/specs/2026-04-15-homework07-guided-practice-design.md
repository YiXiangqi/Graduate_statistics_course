# 设计文档：homework07 复习与练习讲义

**日期**：2026-04-15  
**状态**：待用户审查  
**对应讲义**：`slides/talk07/talk07.qmd`  
**目标文件**：

- `slides/talk07/homework07.qmd`
- `slides/talk07/homework07.html`

---

## 1. 目标

重写 `slides/talk07/homework07.qmd`，创建一份面向学生的 guided practice handout，帮助学生复习并练习第七讲中的三个核心主题：

1. 分类变量进入线性模型后的解释，以及双因素方差分析的基本使用。
2. 非平衡设计下顺序平方和与其他平方和类型的区别。
3. 广义加性模型（GAM）中 smooth term 的显著性检验、默认设置的含义，以及模型诊断与改进。

本次作业应延续现有课程作业风格，但更强调“简短回顾 + 立即练习 + 结果解释”的节奏，而不是把作业写成独立讲义或答案册。

---

## 2. 设计原则

### 2.1 结构原则

- 全文采用 **3 个大 section**：A、B、C，与用户给出的提纲一致。
- 每个 section 先给出与练习直接相关的**简洁回顾**，然后进入逐步展开的小问。
- 每一组题目都要求学生给出**统计解释或结论**，而不只提交代码输出。

### 2.2 内容原则

- 与 `talk07.qmd` 中已有示例和术语顺序保持一致。
- Section A 聚焦 **双因素 ANOVA 与 sums of squares**，不扩展成完整的交互项专题。
- Section B 聚焦 **`summary(gam())` 中 smooth term p 值的零假设**，通过模拟支撑结论。
- Section C 聚焦 **默认 GAM -> 诊断默认设置 -> 改进模型** 的完整分析流程。

### 2.3 风格原则

- 语言使用中文。
- 数学表达使用 LaTeX。
- R 代码优先使用 tidyverse 风格，使用原生管道 `|>`。
- 作业为**学生版题目文件**，不内置 `show_solutions` 参数，也不嵌入隐藏答案块。

---

## 3. 文件结构

`homework07.qmd` 的整体结构如下：

1. YAML header  
2. 作业目标  
3. 提交要求  
4. 数据与 R 包准备  
5. Section A：企鹅数据中的双因素方差分析  
6. Section B：如何理解 smooth term 的 p 值  
7. Section C：HadCRUT4 温度异常时间序列的 GAM 分析  
8. 文档表达与规范  
9. AI 使用声明  
10. 完成作业用时

---

## 4. 题目设计

### 4.1 Section A：企鹅数据中的双因素方差分析

**数据集：** `palmerpenguins::penguins`

**回顾重点：**

- 双因素方差分析可以写成线性模型形式。
- 对分类变量的显著性检验，在非平衡数据下可能依赖平方和类型。
- `anova.lm()` 的结果与模型项顺序有关，这一点需要放到“平衡 / 非平衡设计”的语境下理解。

**练习目标：**

- 使用 `aov()` 或等价线性模型考察 `species` 与 `sex` 对 `body_mass_g` 的影响。
- 判断数据是否平衡，并解释为什么这会影响 ANOVA 表的解读。
- 识别内置 `anova()` 对应的平方和类型，并判断它是否适合当前分析。
- 使用更合适的方法重做分析并比较结论。

**题目结构：**

#### QA.1

- 数据准备仅保留分析所需变量，并去除缺失值。
- 使用双因素方差分析检验 `body_mass_g ~ species + sex`。
- 要求学生说明：
  1. `species` 是否显著；
  2. `sex` 是否显著；
  3. 统计上“显著”在本题里应如何用自然语言表达。

#### QA.2

- 先让学生使用 `count()` 或 `table()` 检查 `species` 与 `sex` 的组合频数。
- 明确追问该数据是否“perfectly balanced”。
- 再使用 `lm()` + `anova()` 对与 QA.1 相同的加性模型做 ANOVA。
- 交换解释变量顺序，重新拟合并比较 ANOVA 表。
- 题目重点是让学生解释：
  - 为什么结果可能变化；
  - 这种变化与非平衡设计之间的关系是什么。

#### QA.3

- 要求学生查明 `anova.lm()` 默认对应哪种 sums of squares。
- 追问这种选择在当前分析中是否理想，并要求给出理由。
- 使用更合适的方法重新分析，默认引导至 `car::Anova()`。
- 允许学生选择并论证 Type II 或其他更合适的方案，但题目主线推荐 Type II，以保持与 `talk07.qmd` 的逻辑一致。

**范围控制：**

- 本 section 不要求拟合 `species * sex` 交互项模型。
- 重点放在**加性模型下的主效应检验与 sums of squares 解读**，避免题目膨胀。

### 4.2 Section B：如何理解 smooth term 的 p 值

**回顾重点：**

- `summary(gam())` 会报告 “Approximate significance of smooth terms”。
- 学生需要判断该 p 值的零假设是在检验“没有关系”还是“关系为线性”。
- 仅凭口头记忆不足以回答，必须结合模拟结果解释。

**练习目标：**

- 正确认识 smooth term p 值对应的零假设。
- 区分“smooth term 显著”和“关系显著非线性”这两个不同问题。
- 通过模拟线性与非线性数据，对比 `edf` 与 p 值的含义。

**题目结构：**

#### QB.1

- 先提出二选一问题：
  - 原假设是“该变量对响应变量没有作用（零函数）”；
  - 还是“该变量与响应变量之间的关系是线性的”。
- 然后要求学生设计并实现两组模拟：
  1. 线性关系数据，例如 $y = \beta_0 + \beta_1 x + \varepsilon$；
  2. 明显非线性关系数据，例如 $y = x^2 + \varepsilon$。
- 两组模拟都使用 `gam(y ~ s(x))` 拟合，并要求学生比较：
  - smooth term 的 p 值；
  - `edf` 是否接近 1；
  - 结果对零假设含义有什么启发。

**结果表达要求：**

- 学生不能只写“查文档得知”，必须用模拟结果支持回答。
- 结论部分要明确写出：该 p 值更接近检验“无效应”而不是“是否线性”。

### 4.3 Section C：HadCRUT4 温度异常时间序列的 GAM 分析

**数据集：** `slides/talk07/data/gtemp.csv`

**回顾重点：**

- `gam(Temperature ~ s(Year), data = gtemp)` 是第七讲中的核心示例。
- `s()` 中的 `k` 决定 basis dimension 上限，`bs` 决定 spline basis 类型。
- `gam()` 中的 `method` 决定平滑参数的估计方式。
- 默认设置可以快速起步，但需要通过诊断来判断是否足够。

**练习目标：**

- 用默认设置拟合并解释一个时间趋势 GAM。
- 读懂 `summary()`、`gam.check()` 输出。
- 判断默认 `k` 是否足够，并据此改进模型。
- 比较默认模型与改进模型的差异，并形成推荐。

**题目结构：**

#### QC.1

- 读取 `gtemp.csv` 并拟合默认模型：

```r
gtemp_gam <- gam(Temperature ~ s(Year), data = gtemp)
```

- 要求学生解释：
  1. `s()` 中 `k` 的作用；
  2. `s()` 中 `bs` 的作用；
  3. `gam()` 中 `method` 的作用；
  4. 这些参数的默认值分别是什么。

#### QC.2

- 解读 `summary(gtemp_gam)` 的结果，包括 smooth term、edf、整体拟合概况。
- 使用 `gam.check()` 诊断默认模型。
- 追问默认 `k` 是否足够，并要求用诊断结果支持回答。
- 题目措辞要避免机械回答“够 / 不够”，而应要求解释“为什么”。

#### QC.3

- 重新拟合模型，要求：
  - 使用 `method = "REML"`；
  - 使用 `bs = "cr"`；
  - 选择一个比默认值更合适的 `k`，并说明理由。
- 引导学生比较默认模型与改进模型在以下方面的差异：
  1. 平滑函数的复杂度（edf）；
  2. smooth term 的显著性；
  3. 诊断结果是否改善；
  4. 对温度异常长期趋势的解释是否变化。

**范围控制：**

- 本 section 不扩展到多 smooth 或 by-smooth 模型。
- 重点始终放在**一个一维时间趋势 GAM 的拟合、诊断和改进**。

---

## 5. 数据流与实现约束

### 5.1 数据与依赖

- 作业文件加载的主要包为：
  - `tidyverse`
  - `mgcv`
  - `car`
  - `palmerpenguins`
- Section A 直接使用 `palmerpenguins::penguins`。
- Section C 从 `slides/talk07/` 目录下渲染时，使用相对路径 `data/gtemp.csv` 读取数据。

### 5.2 代码组织

- 公共包加载放在开头统一处理。
- 每个 section 内仅保留该 section 需要的对象，避免前后依赖过深。
- 保持代码块数量适中，避免作业文件过长。

### 5.3 输出与渲染

- 输出目标为 HTML。
- `homework07.qmd` 修改后，必须同步更新 `homework07.html`。
- 题目文件必须可直接渲染，不依赖额外手工编辑步骤。

### 5.4 Git 与工作区安排

- 实施阶段在一个新的 git worktree 中完成。
- 建议分支 / worktree 名称为：`homework07-guided-practice`。

---

## 6. 验收标准

完成后的 `homework07.qmd` 应满足：

1. 严格包含 A、B、C 三个大 section。
2. 每个 section 先有简洁回顾，再进入练习。
3. Section A 覆盖双因素 ANOVA、平衡性、变量顺序和 sums of squares。
4. Section B 通过模拟回答 smooth term p 值的零假设问题。
5. Section C 覆盖默认 GAM、默认参数解释、默认 `k` 诊断以及改进后的重拟合。
6. 全文为学生版 handout，不内置 `show_solutions` 参数与隐藏答案。
7. `homework07.qmd` 与 `homework07.html` 风格与现有课程材料一致，并可成功渲染。

---

## 7. 风险与取舍

- 如果 Section A 加入交互项分析，会把主线从“sums of squares 与非平衡设计”拉偏，因此本次刻意不纳入。
- 如果 Section B 只让学生查文档而不做模拟，学生容易把“smooth 显著”误读为“非线性显著”。
- 如果 Section C 直接指定一个固定的新 `k` 而不要求解释，学生会把模型诊断理解成机械调参。
- 如果整份 handout 代码太多、解释太少，会削弱“复习与练习”的教学目标。

---

## 8. 后续实施范围

实施阶段仅修改并更新：

- `slides/talk07/homework07.qmd`
- `slides/talk07/homework07.html`

不新增答案文件，不新增额外 section，不改动 `talk07.qmd` 的教学内容。
