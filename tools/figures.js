/* Numeric verification of every figure quoted in Vol.2 prose.
   Run: node tools/figures.js

   Why this exists: the engine derives premiums from iv, so a premium quoted in
   prose cannot drift from the chart. Greeks and derived ratios have no such
   protection — they are typed by hand. Ch11 once claimed a LEAPS delta of
   "0.9 -> 0.2" when the real values were 0.83 -> 0.55, and nothing caught it.
   Each tools/checks/*.js recomputes a chapter's claims against the SAME
   Black-Scholes the browser uses, and asserts the text says that number. */
var fs = require('fs'), path = require('path'), L = require('./lib');

var P = L.loadEngine();
var ctx = { P: P, g: L.greeks(P), Checks: L.Checks, L: L };

var dir = path.join(__dirname, 'checks');
var files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).sort() : [];

var total = 0, failed = 0;
files.forEach(function (f) {
  var c = require(path.join(dir, f))(ctx);
  console.log('\n' + c.chapter + '  (' + c.file + ')');
  c.rows.forEach(function (r) {
    total++;
    if (!r.ok) failed++;
    if (r.prose) {
      console.log('  ' + (r.ok ? 'ok  ' : 'FAIL') + '  ' + r.label);
    } else {
      console.log('  ' + (r.ok ? 'ok  ' : 'FAIL') + '  ' + r.label.padEnd(46) +
        'computed ' + (+r.actual.toFixed(4)) + '   prose ' + r.expected);
    }
  });
});

console.log('\n' + (failed ? failed + '/' + total + ' FIGURE CHECKS FAILED'
                           : total + ' figure checks passed'));
process.exit(failed ? 1 : 0);
