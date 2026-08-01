# 期权策略手册 · The Options Strategy Handbook

交互式中英双语期权电子书。纯静态站点，无构建步骤，无依赖。

## 结构

```
index.html              封面 + 目录
glossary.html           可搜索术语表（正文术语锚点链接至此）
chapters/
  01-what-is-an-option.html  期权的本质：权利、义务与定价直觉
  02-single-leg.html         单腿策略：Long Call / Put · Covered Call · CSP
  03-greeks.html             Greeks：读懂期权的仪表盘
  04-vertical-spreads.html   垂直价差：把观点做成有限风险的结构
  05-volatility.html         波动率策略：Straddle · Strangle · Iron Condor
  06-event-trading.html      事件交易：财报、IV Crush 与价差的用法
  07-wheel.html              Wheel 系统：CSP → 指派 → Covered Call
  08-cautionary-tales.html   反面教材：裸卖、杠杆与波动率的墓碑
  09-sizing-discipline.html  仓位与纪律：Regime、资金管理与"不交易"
  10-parity-synthetics.html  平价关系与合成头寸：期权世界的守恒律
  11-time-structures.html    时间维度：Calendar · Diagonal · PMCC
assets/
  style.css             设计系统 + print CSS（Ctrl+P 导出 PDF）
  i18n.js               中英切换（localStorage 记忆语言，#en hash 可作分享链接的显式覆盖）
  payoff.js             交互式盈亏图引擎（声明式配置 legs 即可复用）
  quiz.js               选择题即时反馈
```

## 部署到 GitHub Pages

```bash
# 本地仓库已初始化并含完整提交历史，直接创建远程并推送：
gh repo create options-handbook --public --source . --push
# 仓库 Settings → Pages → Source: Deploy from a branch → main / (root)
```

或 Cloudflare Pages：连接仓库，Framework preset 选 None，Build command 留空，输出目录 `/`。

## 写新章节

复制 `chapters/02-single-leg.html` 作为模板。交互图只需声明腿配置：

```js
Payoff.mount('elementId', {
  legs: [
    { kind: 'stock', basis: 100 },
    { kind: 'call', side: -1, strike: 110, premium: 3 }  // side: +1 买 / -1 卖
  ],
  range: [75, 135],
  controls: [{ leg: 1, prop: 'strike', min: 100, max: 125, step: 1,
               label: { zh: '行权价', en: 'Strike' } }]
});
```

双语规则：每个文本块内并排写 `<span class="zh">` 与 `<span class="en">`，切换由 CSS 控制。

## PDF 导出

任意页面 Ctrl/Cmd + P。打印样式会隐藏导航与滑块、按当前语言输出、保留图表配色。
