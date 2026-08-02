/* Ch13 — the hedging cost table is the chapter's quantified core, so every
   entry (including the two the chart interpolates) is recomputed here. */
module.exports = function (ctx) {
  var P = ctx.P;
  var c = new ctx.Checks('Ch.13 对冲的工程学', 'chapters/13-hedging.html');
  var r = 0.04, S = 100, SKEW = 0.03;   // 5%-OTM put carries ~3 pts over ATM

  // Annualized cost of rolling a monthly 5%-OTM put, as % of notional.
  function annualCost(atmIV) {
    return P.bsPrice(S, 95, 30 / 365, atmIV + SKEW, r, false) * 12;
  }

  var ivs = [0.15, 0.20, 0.25, 0.30, 0.35, 0.45];
  var expected = [4.5, 8.8, 13.8, 19.3, 25.1, 37.2];
  ivs.forEach(function (iv, i) {
    c.eq('VIX ' + Math.round(iv * 100) + ' -> annual cost %', annualCost(iv), expected[i], 0.05);
  });

  // Compare those calculations with the configuration the page actually sends
  // to CaseChart. This catches drift in the rendered data, not just in a local
  // checker fixture.
  var chart = ctx.L.caseChartConfigs().filter(function (x) {
    return x.file === 'chapters/13-hedging.html' && x.id === 'case-hedge-cost';
  })[0];
  c.eq('hedge-cost chart is mounted', chart ? 1 : 0, 1, 0);
  var expectedLabels = ['VIX 15', 'VIX 20', 'VIX 25', 'VIX 30', 'VIX 35', 'VIX 45'];
  var labels = chart ? chart.cfg.labels : [];
  c.eq('hedge-cost labels match modeled IVs',
       JSON.stringify(labels) === JSON.stringify(expectedLabels) ? 1 : 0, 1, 0);
  var rendered = chart && chart.cfg.series[0] ? chart.cfg.series[0].data : [];
  c.eq('hedge-cost rendered series length', rendered.length, expected.length, 0);
  expected.forEach(function (value, i) {
    c.eq('hedge-cost rendered point ' + expectedLabels[i], rendered[i], value, 0.05);
  });

  c.prose('§13.1 states the calm cost', '4.5%');
  c.prose('§13.1 states the normal cost', '8.8%');
  c.prose('§13.1 states the tense cost', '19.3%');
  c.prose('§13.1 states the panic cost', '37.2%');

  // Conditional price sensitivity with every other model input held fixed.
  c.eq('panic / calm cost ratio', annualCost(0.45) / annualCost(0.15), 8.3, 0.3);
  c.prose('states the eightfold claim', '八倍');

  // The 8.8% is GROSS premium outlay (price x 12, no payouts netted off), while
  // 11.2% is a NET total return. The chapter must not infer net drag from this
  // juxtaposition or from annual return signs.
  c.prose('labels the figure as gross outlay', '毛保费支出');
  c.prose('says payouts offset part of it', '还没有减去它们的赔付');
  c.prose('requires complete net-P/L evidence', '完整净损益回测');
  c.prose('rejects annual-to-monthly payout inference', '年度收益为正或负也不能推断月度尾部赔付');
  c.absent('does not present the invalid subtraction', '这是一道减法');
  c.prose('cites the S&P long-run return', '11.2%');
  c.prose('declares the x12 static-spot simplification', '单月保费 × 12');
  c.prose('denies a gross-cost upper bound', '它也不是实际毛支出的上界');

  /* VXX: retain the issuer-defined product mapping, not an unreproducible
     stitched cumulative-return comparison across predecessor products. */
  c.prose('states the VXX reference index', 'S&amp;P 500 VIX Short-Term Futures Index Total Return');
  c.prose('states the daily-roll mechanism', '逐日调整');
  c.prose('rejects spot-VIX equivalence', '没有承诺按点对点复制现货 VIX');

  /* Universa figures are reported, not computed — assert they are quoted
     with the denominator caveat rather than as a portfolio return. */
  c.prose('quotes the March figure', '+3,612%');
  c.prose('quotes the Q1 figure', '+4,144%');
  c.prose('carries the denominator caveat', '分母是什么');
  c.prose('labels Universa numbers as secondary manager claim', '二手转述');
  c.prose('denies public-audit status', '不是公开审计报告');
  c.absent('does not claim a portfolio-level multiple', '组合涨了 41 倍</strong>');

  return c;
};
