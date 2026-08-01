# 期权策略手册 · The Options Strategy Handbook

交互式中英双语期权电子书。纯静态站点，无构建步骤，无依赖。

## 结构

```
index.html              封面 + 目录
glossary.html           可搜索术语表（正文术语锚点链接至此）
chapters/
  02-single-leg.html    第 2 章（样章）：单腿策略
assets/
  style.css             设计系统 + print CSS（Ctrl+P 导出 PDF）
  i18n.js               中英切换（#en hash 记忆语言）
  payoff.js             交互式盈亏图引擎（声明式配置 legs 即可复用）
  quiz.js               选择题即时反馈
```

## 部署到 GitHub Pages

```bash
git init && git add -A && git commit -m "options handbook: skeleton + ch2 sample"
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
