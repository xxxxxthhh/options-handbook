/* Vol.1 backward-compatibility regression.  Run: node tools/regress.js

   The Vol.2 engine work (Black-Scholes, iv/dte/spot0/ivNow/elapsed) must be
   entirely opt-in: a Vol.1 leg carries only `premium`, so its P/L must be
   identical no matter what `elapsed`/cfg we pass. Legs are also checked for
   finiteness — an earlier version of this test silently "passed" on NaN,
   because NaN comparisons are always false. */
var L = require('./lib');
var P = L.loadEngine();

var configs = L.chartConfigs().filter(function (c) { return L.isVol1(c.file); });
var checked = 0, drift = 0, shown = 0;

configs.forEach(function (c) {
  var lo = c.cfg.range[0], hi = c.cfg.range[1];
  for (var i = 0; i <= 20; i++) {
    var S = lo + (hi - lo) * i / 20;
    var a = P.totalPL(c.cfg.legs, S);                 // Vol.1 call signature
    var b = P.totalPL(c.cfg.legs, S, 999, c.cfg);     // absurd elapsed + cfg
    checked++;
    if (!isFinite(a) || !isFinite(b) || Math.abs(a - b) > 1e-12) {
      drift++;
      if (shown++ < 5) console.log('  DRIFT ' + c.file + ' ' + c.id + ' S=' + S.toFixed(1) + '  ' + a + ' vs ' + b);
    }
  }
});

// A Vol.1 chart must never draw a T+0 curve.
var leaked = configs.filter(function (c) {
  return c.cfg.spot0 != null || c.cfg.legs.some(function (l) { return l.iv != null; });
});
leaked.forEach(function (c) { console.log('  LEAK Vol.2 vocabulary in Vol.1 chart: ' + c.file + ' ' + c.id); });

console.log('Vol.1 charts: ' + configs.length);
console.log('Vol.1 regression: ' + (checked - drift) + '/' + checked + ' points identical ' + (drift ? '<< DRIFT' : 'OK'));
console.log('Vol.2 vocabulary leaked into Vol.1: ' + (leaked.length ? leaked.length + ' <<' : 'none'));
process.exit(drift || leaked.length ? 1 : 0);
