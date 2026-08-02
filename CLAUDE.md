# CLAUDE.md — Options Handbook

交互式中英双语期权电子书。纯静态 HTML/CSS/JS，**无构建步骤，无框架，无依赖**。不要引入 npm 包、打包器或框架。

## 项目状态

- **Vol.1（第 1–9 章）+ Vol.2 前两章（第 10–11 章）已完成**：https://xxxxxthhh.github.io/options-handbook/ （GitHub Pages, main 分支根目录）
- 质量基准仍为 chapters/02-single-leg.html（样章）
- 目录进度 badge 已随全书完成而移除；新增章节时只需在 index.html 目录加链接，并接好前后章 `.chap-nav`

### Vol.2 待写章节（backlog，按建议顺序）

已做过案例可行性评估，**动手前先读下面的否决/注意事项**，不要重新推导：

1. **蝶式与结构工程**（Butterfly / Broken-Wing / Ratio / Backspread）——现引擎已支持任意腿数，零改动。注意 1x2 Ratio 隐含裸卖属性，需接第 8 章
2. **对冲的工程学**（尾部对冲成本、VIX 产品作为保险）——⚠️ JHEQX 已在第 10.5 节用掉；⚠️ "50 Cent"（VIX 大户）对 Ruffer 的归因属媒体推测、从未被证实，**只可定性引用交易形态，不得指名机构、不得给量化 verdict**（与软银 Whale 同类问题）
3. **管理与运维**（Roll 的诚实算法、50% 止盈 / 21 DTE、除息提前指派、Pin Risk、SPX vs SPY）——0DTE **写成 `.warn` 而非策略章节**（现占 SPX 成交量过半，略过会让书过时，但不等于该教它）；美国 1256 税务**只写一句 + 免责声明**，展开就是跨辖区维护噩梦
4. **证据素养**（CBOE BXM / PUT / CNDR 三十年基准）——全章零虚构价格，最符合本书数据洁癖。⚠️ 这些是**指数**收益而非可投资基金收益，BXM 与真实 buy-write 基金的费后差距**本身就是课程内容**，不是脚注

**不建议加**：奇异期权（散户碰不到）、Vanna/Volga 专章（在 skew 里定性带过即可）、个股推荐（毁掉教育向立场）、深度税务。

**候选池**：2020 软银 Nasdaq Whale（同上，只可定性）、2015-08-24 ETF 闪崩、Barings/Leeson 1995、2010-05-06 闪崩。

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
  - Ch10 1R0NYMAN box spread 2019-01（UVXY 美式提前行权）· JPM JHEQX 季度 collar
  - Ch11 期限结构倒挂（示意 IV 演示）· NFLX 2022-04-20 PMCC 杠杆
- 候选池（尚未使用）：2020 软银 Nasdaq Whale（**注意：公开数字为媒体报道且被软银部分否认，只可定性引用，不要给量化 verdict**）、1998 长期资本以外的对冲基金爆仓、2015-08-24 ETF 闪崩、Barings/Leeson 1995、2010-05-06 闪崩

### 图表
- 到期盈亏图：`Payoff.mount(id, { legs, range, controls })`；leg 形如 `{kind:'call'|'put'|'stock', side:±1, strike, premium}` 或 `{kind:'stock', basis}`；引擎自动算 breakeven/max gain/max loss，**不要**手绘 SVG 盈亏图
- 历史走势图：`CaseChart.mount(id, { labels, series:[{name:{zh,en}, color, data}], events })`；亏损/裸持仓线用 `#FF6A55`，盈利/对冲线用 `#3CDFA3`
- 图表一律包在 `.panel`（深色仪表面板）中，`panel-title` 用 mono 大写
- 多腿新策略（spread/condor）直接用现有 legs 数组表达，引擎已支持任意腿数；若需新控件类型才改 payoff.js，并保持向后兼容

### Vol.2 引擎词汇（第 10 章起）

Vol.1 的腿写 `premium`（作者给定，只画到期折线）。**Vol.2 的腿改写 `iv` + `dte`，权利金由引擎从 `cfg.spot0` 用 Black-Scholes 反推**——这样正文引用的权利金和曲线不可能对不上（Vol.1 那种"图文各算一遍"的漂移在这里结构性地不存在）。

```js
Payoff.mount('id', {
  spot0: 100, rate: 0.04, elapsed: 0,          // spot0 + iv 才会画 T+0 虚线
  legs: [{ kind:'call', side:-1, strike:100, iv:0.35, dte:30 },
         { kind:'call', side:1,  strike:100, iv:0.28, ivNow:0.28, dte:60 }],
  controls: [{ prop:'elapsed', ... },           // 省略 leg 即作用于 cfg 本身
             { leg:1, prop:'ivNow', ... }]      // ivNow 只改估值，不改入场成本
});
```

- `iv` = **入场**波动率，锁定你付出的权利金；`ivNow` = **当前**波动率，只用于给 T+0 曲线和存活腿定价，默认等于 `iv`。要演示"开仓后 IV 变化"必须用 `ivNow`，否则拖动滑块会连入场成本一起改写
- 多到期结构（Calendar）的实线画在**最近腿到期**时刻，存活腿按 `ivNow` 定价——**那已经不是"到期盈亏图"而是中途估值，章节里必须显式说明**（见 11.2 的 `.warn`）
- 全书唯一一份 Black-Scholes 实现在 payoff.js，Node 校验脚本应从该文件 `eval` 出来用，**不要另写一份**
- 所有 Vol.1 配置零改动：`node --check` + 546→651 点回归全等已验证；**不要回填 Vol.1 图表**（需要凭空补 spot0/dte，且 Ch4 `pf-bear-put` 的 $7 权利金低于内在价值，本就无法承载 T+0 线）

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
sh tools/check-all.sh                    # 全部自动检查，失败即非零退出
python3 -m http.server 8000              # 手动过一遍：中英切换、滑块、测验、术语链接
# 打印预览 (Ctrl+P)：分页不截断 .panel/.quiz，测验答案在打印时展开
```

`tools/` 里的四个检查器（**不要重写，直接用**）：

| 工具 | 查什么 |
|---|---|
| `tools/qa.js` | 双语 span 配对 + **en 块里混入中文/zh 块里没中文**（数量相等查不出这类）、术语锚点（含 glossary 内部）、内链、图表挂载双向配对、quiz 答案与解析、case 的 tag 与 verdict |
| `tools/regress.js` | Vol.1 的 26 张图在新引擎下逐点全等（546 点），且 Vol.2 词汇未泄漏进 Vol.1 |
| `tools/figures.js` | 跑 `tools/checks/chNN.js`，把正文引用的每个数字用引擎复算，**并断言正文确实写着那个数字**；`absent()` 用于确保旧的错误值不会复活 |
| `tools/lib.js` | 共享：从 payoff.js 读出引擎、抽取各章 mount 配置、有限差分算 Greeks |

**新写一章时，同时写 `tools/checks/chNN.js`。** 这不是可选项——引擎派生的权利金不会漂移，但正文手写的 Greeks、比率、百分比没有任何防线：第 11 章曾写 LEAPS Delta「0.9 → 0.2」，真值是 0.83 → 0.55，QA 全绿也照样漏过去，正是这个检查器补上的缺口。

## 设计 token（勿改，改前先问）

paper #F4F6F5 · ink #14212B · panel #0C1820 · gain #1E9E71/#3CDFA3 · loss #CE4A37/#FF6A55 · amber #D99A3D
字体：IBM Plex Serif（标题）/ Plex Sans + 系统中文（正文）/ Plex Mono（数据、标签）
