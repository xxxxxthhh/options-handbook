# CLAUDE.md — Options Handbook

交互式中英双语期权电子书。纯静态 HTML/CSS/JS，**无构建步骤，无框架，无依赖**。不要引入 npm 包、打包器或框架。

## 项目状态

- **全书 15 章已完成并发布**：https://xxxxxthhh.github.io/options-handbook/ （GitHub Pages, main 分支根目录）
- 质量基准仍为 chapters/02-single-leg.html（样章）
- 目录进度 badge 已随全书完成而移除；新增章节时只需在 index.html 目录加链接，并接好前后章 `.chap-nav`

### Vol.2 已完成（第 10–15 章）

全书 **15 章完结**。Vol.2 的两条主线：第 10 章说明平价关系的到期恒等式与合约边界，
第 15 章用四十年 Cboe 基准数据收束"这一切长期到底值不值得做"。

**backlog 已清空。** 若要继续扩展，先读下面这些已做过的否决判断，不要重新推导：
- **不建议加**：奇异期权（散户碰不到）、Vanna/Volga 专章（在 skew 里定性带过即可）、
  个股推荐（毁掉教育向立场）、深度税务（跨辖区维护噩梦）
- **案例池里的雷**：2020 软银 Nasdaq Whale 与"50 Cent"（VIX 大户）的归因均属
  媒体推测且被当事方部分否认，**只可定性引用、不得指名机构、不得给量化 verdict**；
  Universa 的 +4,144% 只是媒体对非公开投资者信中管理人声称的转述；分母、费用与组合贡献未经公开审计（已在 13.2 作为 `.warn` 处理）
- **尚可用**：2015-08-24 已用于 14.4；Barings/Leeson 1995、2010-05-06 闪崩仍未使用

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
  - Ch10 1R0NYMAN 匿名论坛自述（仅用一手产品文件验证 UVXY/ETP 美式提前行权机制，不采信金额）· JPM Hedged Equity 官方 collar 方法的本书示意模型
  - Ch11 期限结构倒挂（示意 IV 演示）· NFLX 2022-04-20 PMCC 杠杆
  - Ch12 到期日钉住效应（Ni-Pearson-Poteshman, JFE 2005）· 2022-11-10 CPI 日
  - Ch13 VXX 产品文件映射（短期 VIX 期货指数，不是现货 VIX）· Universa 二手管理人回报声称的分母警示——**本章只有 1 个正式 case 是有意为之**：
    第二个若强行凑出来会与第 3 章 2024-08「保险要在着火前买」重复，不要补
  - Ch14 除息日提前指派阈值 · 2015-08-24 ETF 闪崩
  - Ch15 Cboe BXM 四十年记录 · 2022 vs 2018 两个下跌年

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
- 所有 Vol.1 配置零改动：`node --check` + 546 点回归全等已验证；**不要回填 Vol.1 图表**（需要凭空补 spot0/dte，且 Ch4 `pf-bear-put` 的 $7 权利金低于内在价值，本就无法承载 T+0 线）

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

**已知缺口**：`figures.js` 目前只覆盖 Vol.2（第 10–15 章）。Vol.1 的正文数字
只在写作当时人工核对过，如果将来改动第 1–9 章的任何数字，没有任何东西会重算它——
要改就顺手补一个 `tools/checks/chNN.js`。

**新写一章时，同时写 `tools/checks/chNN.js`。** 这不是可选项——引擎派生的权利金不会漂移，但正文手写的 Greeks、比率、百分比没有任何防线：第 11 章曾写 LEAPS Delta「0.9 → 0.2」，真值是 0.83 → 0.55，QA 全绿也照样漏过去，正是这个检查器补上的缺口。

## 设计 token（勿改，改前先问）

paper #F4F6F5 · ink #14212B · panel #0C1820 · gain #1E9E71/#3CDFA3 · loss #CE4A37/#FF6A55 · amber #D99A3D
字体：IBM Plex Serif（标题）/ Plex Sans + 系统中文（正文）/ Plex Mono（数据、标签）
