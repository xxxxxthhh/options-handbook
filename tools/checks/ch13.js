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

  c.eq('VIX 15 -> annual cost %', annualCost(0.15), 4.5, 0.05);
  c.eq('VIX 20 -> annual cost %', annualCost(0.20), 8.8, 0.05);
  c.eq('VIX 25 -> annual cost % (chart point)', annualCost(0.25), 13.8, 0.05);
  c.eq('VIX 30 -> annual cost %', annualCost(0.30), 19.3, 0.05);
  c.eq('VIX 35 -> annual cost % (chart point)', annualCost(0.35), 25.1, 0.05);
  c.eq('VIX 45 -> annual cost %', annualCost(0.45), 37.2, 0.05);

  c.prose('§13.1 states the calm cost', '4.5%');
  c.prose('§13.1 states the normal cost', '8.8%');
  c.prose('§13.1 states the tense cost', '19.3%');
  c.prose('§13.1 states the panic cost', '37.2%');

  // the ratio that drives "hedge once trouble starts is unavailable"
  c.eq('panic / calm cost ratio', annualCost(0.45) / annualCost(0.15), 8.3, 0.3);
  c.prose('states the eightfold claim', '八倍');

  // The 8.8% is GROSS premium outlay (price x 12, no payouts netted off), while
  // 11.2% is a NET total return. The chapter must NOT subtract one from the other;
  // it may only say they are of the same order of magnitude.
  c.prose('labels the figure as gross outlay', '毛保费支出');
  c.prose('says payouts offset part of it', '还没有减去它们的赔付');
  c.prose('states same-order-of-magnitude, not subtraction', '同一个量级');
  c.absent('does not present the invalid subtraction', '这是一道减法');
  c.prose('cites the S&P long-run return', '11.2%');
  c.prose('declares the x12 static-spot simplification', '单月保费 × 12');

  /* VXX: public figures, plus the annualization this book performs */
  var yrs = 17, cum = -0.9802;
  c.eq('VXX annualized from -98.02% over 17y', (Math.pow(1 + cum, 1 / yrs) - 1) * 100, -20.6, 0.1);
  c.prose('states VXX cumulative', '98%');
  c.prose('states VIX cumulative', '65%');
  c.prose('states the annualized decay', '−20.6%');
  // the comparison the verdict rests on
  c.eq('VXX decay vs rolling puts, gross (x)', 20.6 / annualCost(0.20), 2.34, 0.05);
  c.prose('flags that comparison as conservative', '这个对比是偏保守的');

  /* Universa figures are reported, not computed — assert they are quoted
     with the denominator caveat rather than as a portfolio return. */
  c.prose('quotes the March figure', '+3,612%');
  c.prose('quotes the Q1 figure', '+4,144%');
  c.prose('carries the denominator caveat', '分母是什么');
  c.absent('does not claim a portfolio-level multiple', '组合涨了 41 倍</strong>');

  return c;
};
