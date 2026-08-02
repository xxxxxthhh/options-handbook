/* Shared helpers for the handbook's checkers.
   No dependencies, no build step — plain Node, same as the site.

   The single Black-Scholes implementation lives in assets/payoff.js and is
   read back out of that file here, so a checker can never drift from what
   the browser actually renders. */
var fs = require('fs'), path = require('path');

var ROOT = path.resolve(__dirname, '..');

/* ---- the engine, as the browser sees it ---- */
function loadEngine() {
  var src = fs.readFileSync(path.join(ROOT, 'assets/payoff.js'), 'utf8');
  // Everything up to CaseChart is DOM-free and safe to evaluate in Node.
  var head = src.slice(0, src.indexOf('/* ---------- CaseChart'));
  var Payoff;
  eval(head);
  return Payoff;
}

/* ---- page inventory ---- */
function pages() {
  var chapters = fs.readdirSync(path.join(ROOT, 'chapters'))
    .filter(function (f) { return /\.html$/.test(f); }).sort()
    .map(function (f) { return 'chapters/' + f; });
  return ['index.html', 'glossary.html'].concat(chapters);
}
function isVol1(rel) { return /chapters\/0[1-9]-/.test(rel) || rel === 'index.html'; }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

/* ---- extract the real Payoff.mount configs by running each page's script ---- */
function chartConfigs() {
  var out = [];
  pages().forEach(function (rel) {
    var m = read(rel).match(/<script>\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/);
    if (!m) return;
    var code = m[0].replace(/<\/?script>/g, '');
    try {
      new Function('Payoff', 'CaseChart', 'document', code)(
        { mount: function (id, cfg) { out.push({ file: rel, id: id, cfg: cfg }); } },
        { mount: function () {} },
        { addEventListener: function (e, fn) { fn(); },
          // glossary.html's script drives its search box; stub enough of the
          // DOM that it runs harmlessly instead of throwing.
          getElementById: function () { return { addEventListener: function () {} }; },
          querySelectorAll: function () { return []; } }
      );
    } catch (e) {
      console.log('  !! could not evaluate ' + rel + ': ' + e.message);
    }
  });
  return out;
}

/* ---- Greeks by finite difference on the engine's own bsPrice ----
   Prose that quotes a delta must be checkable the same way prose that quotes
   a premium is. Ch11 once claimed a LEAPS delta of 0.9 -> 0.2 when the real
   figures were 0.83 -> 0.55; nothing caught it because only prices were
   verified. These exist so that class of error is catchable. */
function greeks(P) {
  var h = 0.01;
  return {
    delta: function (S, K, T, v, r, isCall) {
      return (P.bsPrice(S + h, K, T, v, r, isCall) - P.bsPrice(S - h, K, T, v, r, isCall)) / (2 * h);
    },
    gamma: function (S, K, T, v, r, isCall) {
      return (P.bsPrice(S + h, K, T, v, r, isCall) - 2 * P.bsPrice(S, K, T, v, r, isCall)
              + P.bsPrice(S - h, K, T, v, r, isCall)) / (h * h);
    },
    vega: function (S, K, T, v, r, isCall) {   // per 1 volatility POINT
      return (P.bsPrice(S, K, T, v + 0.005, r, isCall) - P.bsPrice(S, K, T, v - 0.005, r, isCall)) / 100;
    }
  };
}

/* ---- tiny assertion collector used by tools/checks/*.js ---- */
function Checks(chapter, file) {
  this.chapter = chapter; this.file = file; this.rows = [];
  this.html = file ? read(file) : '';
}
// Assert a figure quoted in prose literally appears in the chapter. Pairs with
// eq(): eq proves the number is right, prose proves the text says that number.
Checks.prototype.prose = function (label, needle) {
  var found = this.html.indexOf(needle) !== -1;
  this.rows.push({ label: label + '  [prose "' + needle + '"]', prose: true, ok: found });
  return this;
};
// Assert a stale figure is gone from the chapter.
Checks.prototype.absent = function (label, needle) {
  var found = this.html.indexOf(needle) !== -1;
  this.rows.push({ label: label + '  [stale "' + needle + '" removed]', prose: true, ok: !found });
  return this;
};
Checks.prototype.eq = function (label, actual, expected, tol) {
  tol = tol == null ? 0.005 : tol;
  this.rows.push({ label: label, actual: actual, expected: expected, tol: tol,
                   ok: Math.abs(actual - expected) <= tol });
  return this;
};
// For a claim that a quantity is constant across a range (e.g. covered call
// minus short put). Passing an array asserts every element equals `expected`.
Checks.prototype.constant = function (label, values, expected, tol) {
  tol = tol == null ? 0.005 : tol;
  var mn = Math.min.apply(null, values), mx = Math.max.apply(null, values);
  this.rows.push({ label: label + ' (min..max ' + mn.toFixed(4) + '..' + mx.toFixed(4) + ')',
                   actual: mx, expected: expected, tol: tol,
                   ok: (mx - mn) <= tol && Math.abs(mx - expected) <= tol });
  return this;
};

module.exports = { ROOT: ROOT, loadEngine: loadEngine, pages: pages, isVol1: isVol1,
                   read: read, chartConfigs: chartConfigs, greeks: greeks, Checks: Checks };
