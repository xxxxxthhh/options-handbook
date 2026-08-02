/* Ch15 — this chapter quotes NO computed option prices; every figure is from
   the Cboe BXM factsheet (as of 2026-06-30). What the checker verifies here is
   therefore different in kind: that the arithmetic derived FROM those published
   figures (compounding, differences, ratios) is right, and that the published
   figures themselves appear in the prose exactly as sourced. */
module.exports = function (ctx) {
  var c = new ctx.Checks('Ch.15 证据素养', 'chapters/15-evidence.html');

  /* --- published Cboe BXM factsheet figures (from June 20, 1986) --- */
  var pub = { bxmRet: 8.5, spxRet: 11.2, bxmVol: 10.7, spxVol: 15.2,
              bxmDD: -35.8, spxDD: -50.9, bxmBeta: 0.62,
              bxmSharpe: 0.55, spxSharpe: 0.56, bxmSortino: 0.75, spxSortino: 0.84 };
  Object.keys(pub).forEach(function (k) { /* presence asserted below by prose */ });

  c.prose('BXM annualized return', '8.5%');
  c.prose('S&P total return', '11.2%');
  c.prose('BXM volatility', '10.7%');
  c.prose('S&P volatility', '15.2%');
  c.prose('BXM max drawdown', '−35.8%');
  c.prose('S&P max drawdown', '−50.9%');
  c.prose('BXM beta', '0.62');
  c.prose('Sharpe pair', '0.55');
  c.prose('Sortino pair', '0.75');

  /* --- derived arithmetic the prose states --- */
  c.eq('return gap (points)', pub.spxRet - pub.bxmRet, 2.7, 0.001);
  // BXM's drawdown is SHALLOWER, so the prose quotes the magnitude of the gap.
  c.eq('drawdown gap (points, magnitude)', Math.abs(pub.spxDD) - Math.abs(pub.bxmDD), 15.1, 0.001);
  c.prose('states the return gap', '2.7');
  c.prose('states the drawdown gap', '15.1');

  /* --- cumulative growth compounded from published calendar-year returns --- */
  var bxmCY = [5.7, 5.2, 13.3, 5.6, 5.2, 7.1, 13.0, -4.8, 15.7, -2.8, 20.5, -11.4, 11.8, 20.1, 8.9];
  var spxCY = [2.1, 16.0, 32.4, 13.7, 1.4, 12.0, 21.8, -4.4, 31.5, 18.4, 28.7, -18.1, 26.3, 25.0, 17.9];
  var a = 100, b = 100;
  bxmCY.forEach(function (r) { a *= 1 + r / 100; });
  spxCY.forEach(function (r) { b *= 1 + r / 100; });
  c.eq('BXM $100 -> 2025', a, 283.1, 0.15);
  c.eq('S&P $100 -> 2025', b, 720.2, 0.5);
  c.eq('ratio between them', b / a, 2.54, 0.01);
  c.prose('states BXM terminal value', '$283');
  c.prose('states S&P terminal value', '$720');
  c.prose('states the ratio', '2.54');

  // Verify the configuration that the browser actually passes to CaseChart.
  // Recomputing a second local series would prove only the fixture and would
  // miss a stale or hand-edited value in the rendered chapter.
  var chart = ctx.L.caseChartConfigs().filter(function (x) {
    return x.file === 'chapters/15-evidence.html' && x.id === 'case-bxm-cum';
  })[0];
  c.eq('BXM cumulative chart is mounted', chart ? 1 : 0, 1, 0);

  var expectedLabels = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017',
                        '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  var labels = chart ? chart.cfg.labels : [];
  c.eq('chart labels match the calendar-year window',
       JSON.stringify(labels) === JSON.stringify(expectedLabels) ? 1 : 0, 1, 0);

  function compounded(yearly) {
    var acc = 100, out = [100];
    yearly.forEach(function (r) { acc *= 1 + r / 100; out.push(+acc.toFixed(1)); });
    return out;
  }
  function seriesNamed(name) {
    if (!chart) return [];
    var row = chart.cfg.series.filter(function (s) { return s.name && s.name.en === name; })[0];
    return row ? row.data : [];
  }
  var expectedBXM = compounded(bxmCY), expectedSPX = compounded(spxCY);
  var renderedBXM = seriesNamed('BXM'), renderedSPX = seriesNamed('S&P 500 TR');
  c.eq('BXM rendered series length', renderedBXM.length, expectedBXM.length, 0);
  c.eq('S&P rendered series length', renderedSPX.length, expectedSPX.length, 0);
  expectedBXM.forEach(function (value, i) {
    c.eq('BXM rendered point ' + expectedLabels[i], renderedBXM[i], value, 0.05);
  });
  expectedSPX.forEach(function (value, i) {
    c.eq('S&P rendered point ' + expectedLabels[i], renderedSPX[i], value, 0.05);
  });

  /* --- how many years BXM led --- */
  var led = 0;
  for (var i = 0; i < bxmCY.length; i++) if (bxmCY[i] > spxCY[i]) led++;
  c.eq('years BXM led, of 15', led, 3, 0);
  c.prose('states 3 of 15', '3 年');

  /* --- the two down years, which the whole §15.5 case rests on --- */
  c.eq('2022 BXM vs S&P (points better)', bxmCY[11] - spxCY[11], 6.7, 0.001);
  c.eq('2018 BXM vs S&P (points worse)', bxmCY[7] - spxCY[7], -0.4, 0.001);
  c.prose('states 2022 BXM', '−11.4%');
  c.prose('states 2022 S&P', '−18.1%');
  c.prose('states 2018 BXM', '−4.8%');
  c.prose('states 2018 S&P', '−4.4%');
  c.prose('states the 2022 advantage', '6.7');
  c.prose('states the 2018 shortfall', '0.4');

  /* --- §15.3 source values plus the comparability boundary --- */
  var ek = { put: 10.32, spx: 8.77 };          // Ennis Knupp, Jan 2009, Jul 1986-Oct 2008
  c.eq('2009 study edge (points)', ek.put - ek.spx, 1.55, 0.001);
  c.prose('states the 2009 PUT figure', '10.32%');
  c.prose('states the 2009 S&P figure', '8.77%');
  c.prose('states that edge', '1.55');
  c.prose('rejects single-difference attribution', '不能把两组结果相减或归因于单一差异');

  /* --- this chapter must contain no book-computed option prices --- */
  c.prose('declares no illustrative values', '没有任何示意值');
  c.absent('no 示意值 leaked into a source statement', '示意值）由本书');

  return c;
};
