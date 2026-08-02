/* Ch14 — roll arithmetic and the early-assignment threshold are the two
   quantified claims; the 2015-08-24 and 0DTE figures are public data. */
module.exports = function (ctx) {
  var P = ctx.P;
  var c = new ctx.Checks('Ch.14 管理与运维', 'chapters/14-operations.html');
  var r = 0.04;

  /* §14.1 the roll: sold the $100 put for $3.00, stock now $92, 10 days left */
  var cfg = { spot0: 92, rate: r };
  var closeCost = P.bsPrice(92, 100, 10 / 365, 0.30, r, false);
  var rollCredit = P.bsPrice(92, 100, 45 / 365, 0.30, r, false);
  c.eq('cost to close the losing put', closeCost, 7.99, 0.01);
  c.eq('realized loss on the original', closeCost - 3.00, 4.99, 0.01);
  c.eq('premium collected on the 45d roll', rollCredit, 8.84, 0.01);
  c.eq('net credit of the roll', rollCredit - closeCost, 0.85, 0.01);
  c.eq('new position max loss', 100 - rollCredit, 91.16, 0.01);
  c.prose('§14.1 states the close cost', '$7.99');
  c.prose('§14.1 states the realized loss', '$4.99');
  c.prose('§14.1 states the roll credit', '$0.85');
  c.prose('§14.1 states the new max loss', '$91.16');
  // the credit must genuinely be positive — that is what makes the trap a trap
  c.eq('the roll really does pay you (sign)', (rollCredit - closeCost) > 0 ? 1 : 0, 1, 0);

  /* §14.3 early assignment: extrinsic value vs the dividend */
  function extrinsic(S, K, dte, iv) {
    return P.bsPrice(S, K, dte / 365, iv, r, true) - Math.max(S - K, 0);
  }
  var DIV = 0.80;
  c.eq('$95 call, 30 days: time value', extrinsic(100, 95, 30, 0.20), 0.82, 0.01);
  c.eq('$95 call, 10 days: time value', extrinsic(100, 95, 10, 0.20), 0.18, 0.01);
  c.eq('$90 call, 10 days: time value', extrinsic(100, 90, 10, 0.20), 0.10, 0.01);
  // the rule's direction must hold: 30d is safe, 10d is not
  c.eq('30-day is above the dividend', extrinsic(100, 95, 30, 0.20) > DIV ? 1 : 0, 1, 0);
  c.eq('10-day is below the dividend', extrinsic(100, 95, 10, 0.20) < DIV ? 1 : 0, 1, 0);
  c.prose('§14.3 states the safe case', '$0.82');
  c.prose('§14.3 states the assigned case', '$0.18');
  c.prose('§14.3 states the deep-ITM case', '$0.10');
  c.prose('§14.3 states the dividend', '$0.80');

  /* §14.4 uses one reproducible SEC DERA denominator and the documented
     full-year Cboe figure; these positive source invariants are the contract. */
  c.prose('cites SEC DERA ETF sample', '1,569');
  c.prose('cites SEC DERA ETF pauses', '302');
  c.prose('cites SEC DERA pause share', '19.2%');
  c.prose('states stop-market trigger is not price guarantee', '不保证成交价');
  c.prose('cites 0DTE full-year 2025', '59%');

  // Read the CaseChart configuration the browser actually receives.
  var chart = ctx.L.caseChartConfigs().filter(function (x) {
    return x.file === 'chapters/14-operations.html' && x.id === 'case-0dte';
  })[0];
  c.eq('0DTE chart is mounted', chart ? 1 : 0, 1, 0);
  c.eq('0DTE chart labels the supported full-year period',
       chart && JSON.stringify(chart.cfg.labels) === JSON.stringify(['2025 FY']) ? 1 : 0, 1, 0);
  var chartValue = chart && chart.cfg.series[0] ? chart.cfg.series[0].data[0] : NaN;
  c.eq('0DTE rendered chart FY2025 = cited prose', chartValue, 59, 0);

  /* the tax mention must stay one sentence with a disclaimer */
  c.prose('tax note carries a disclaimer', '本书不提供税务建议');
  c.prose('tax note is scoped to the US', '仅适用于美国纳税人');

  return c;
};
