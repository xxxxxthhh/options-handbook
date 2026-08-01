# CLAUDE.md — Options Handbook

交互式中英双语期权电子书。纯静态 HTML/CSS/JS，**无构建步骤，无框架，无依赖**。不要引入 npm 包、打包器或框架。

## 项目状态

- **9 章全部完成并已发布**：https://xxxxxthhh.github.io/options-handbook/ （GitHub Pages, main 分支根目录）
- 质量基准仍为 chapters/02-single-leg.html（样章）
- 目录进度 badge 已随全书完成而移除；新增章节时只需在 index.html 目录加链接，并接好前后章 `.chap-nav`

## 硬性约定（违反即返工）

### 双语
- 每个文本块内并排写 `<span class="zh">…</span><span class="en">…</span>`，切换由 CSS 控制，**不得**建立 zh/en 两套页面
- en 不是 zh 的直译：允许为英文读者重写句式，但事实、数字、结论必须一致
- 中文正文保留英文术语原词（Covered Call、IV Crush…），首次出现时以 `<a class="term" href="../glossary.html#锚点">` 链接术语表；新术语必须同步添加到 glossary.html（含锚点 id）

### 案例（每章至少 1 个，目标 2 个）
- 使用 `.case` 卡片：`case-tag`（CASE FILE · YYYY-MM）→ 标题 → 事件叙述 → counterfactual 对比 → `.verdict gain|loss` 结论标签
- 结论标签必须落在"利润扩大"或"亏损减少"之一，并给出量化对比（如 -34% → -4%）
- **两级数据口径，勿混用**：真实历史价格（股价、指数、VIX、汇率）标"约值 approx."；由 Black-Scholes 算出或自行假设的期权价格、权利金、Strike 一律标"**示意值**"，并在案例末尾用一段"简化声明"讲清哪些是真实数据、哪些是假设、忽略了什么
- 反事实若能只用真实数据的算术完成（如仓位比例、杠杆倍数），**优先如此**，不要为了凑数字而虚构期权腿
- 已用案例（勿重复）：
  - Ch01 泰勒斯榨油机（约 BC600）· 伯克希尔指数 Put（2004–18）
  - Ch02 NVDA 2023-05 财报 · SPY 2020 COVID · AAPL 2022 CC · Buffett KO 1993
  - Ch03 GameStop 2021-01 · 日元套息平仓 2024-08-05
  - Ch04 疫苗日 DAL 2020-11 · ARKK 2021-11
  - Ch05 Brexit 2016-06 · 2017 低波动年→2018-02-05
  - Ch06 META 2022-02 · AAPL 2021-01 财报
  - Ch07 MSFT 2020 崩盘中被指派 · INTC 2022 Wheel
  - Ch08 XIV/Volmageddon 2018-02 · optionsellers.com 2018-11 · 黑色星期一 1987-10
  - Ch09 LTCM 1998 · 巴菲特 1969 清盘合伙企业
- 候选池（尚未使用）：2020 软银 Nasdaq Whale（**注意：公开数字为媒体报道且被软银部分否认，只可定性引用，不要给量化 verdict**）、1998 长期资本以外的对冲基金爆仓、2015-08-24 ETF 闪崩、Barings/Leeson 1995、2010-05-06 闪崩

### 图表
- 到期盈亏图：`Payoff.mount(id, { legs, range, controls })`；leg 形如 `{kind:'call'|'put'|'stock', side:±1, strike, premium}` 或 `{kind:'stock', basis}`；引擎自动算 breakeven/max gain/max loss，**不要**手绘 SVG 盈亏图
- 历史走势图：`CaseChart.mount(id, { labels, series:[{name:{zh,en}, color, data}], events })`；亏损/裸持仓线用 `#FF6A55`，盈利/对冲线用 `#3CDFA3`
- 图表一律包在 `.panel`（深色仪表面板）中，`panel-title` 用 mono 大写
- 多腿新策略（spread/condor）直接用现有 legs 数组表达，引擎已支持任意腿数；若需新控件类型才改 payoff.js，并保持向后兼容

### 章节结构（照抄 02 章的骨架）
1. eyebrow + h1 + lede
2. 每个策略：`.spec` 规格条（Outlook/Max gain/Max loss/Breakeven/…）→ 意义 → 适用场景 → 交互图 → 案例/警示
3. `.warn`（反面/风险）与 `.note`（与实盘连接）穿插使用；每个策略后放一个 `.think` 思考题
4. `2.x 本章测验`：`.quiz-set` 内 4–6 道 `.quiz`（data-answer 指定答案，expl 必须解释为什么错误项错）
5. 本章要点（一段综合性 prose，不用列表）
6. `.chap-nav` 前后章导航

### 语气与立场
- 教育向，不构成投资建议；卖方策略必须强调抵押与前提（"Strike 是你真心愿意成交的价格"）
- 贯穿全书的主线：策略无优劣，只有与 Regime 的匹配；入场纪律 > 管理技巧；"不交易"是合法输出

## QA（每章提交前）

```bash
node --check assets/*.js                 # 若改动了 JS
python3 -m http.server 8000              # 手动过一遍：中英切换、滑块、测验、术语链接
# 打印预览 (Ctrl+P)：分页不截断 .panel/.case/.quiz，测验答案在打印时展开
```

- 双语完整性检查：`grep -c 'class="zh"'` 与 `grep -c 'class="en"'` 数量应相等
- glossary 锚点检查：正文所有 `.term` 链接的 `#id` 必须存在于 glossary.html

## 设计 token（勿改，改前先问）

paper #F4F6F5 · ink #14212B · panel #0C1820 · gain #1E9E71/#3CDFA3 · loss #CE4A37/#FF6A55 · amber #D99A3D
字体：IBM Plex Serif（标题）/ Plex Sans + 系统中文（正文）/ Plex Mono（数据、标签）
