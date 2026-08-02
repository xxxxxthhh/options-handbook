/* Ch11 — every number the prose quotes, recomputed from the engine.
   The delta claims here are the ones that were wrong on first writing
   (0.9 -> 0.2 instead of 0.83 -> 0.55); they are checked explicitly. */
module.exports = function (ctx) {
  var P = ctx.P, g = ctx.g;
  var c = new ctx.Checks('Ch.11 时间维度', 'chapters/11-time-structures.html');

  var r = 0.04;

  /* §11.2 base calendar: sell 30d @35%, buy 60d @28%, spot/strike 100 */
  function calendar(ivNear, ivFar, ivFarNow) {
    var cfg = { spot0: 100, rate: r, legs: [
      { kind: 'call', side: -1, strike: 100, iv: ivNear, dte: 30 },
      { kind: 'call', side: 1, strike: 100, iv: ivFar, ivNow: ivFarNow, dte: 60 }] };
    var debit = P.legPremium(cfg.legs[1], cfg) - P.legPremium(cfg.legs[0], cfg);
    return { debit: debit,
             flat: P.totalPL(cfg.legs, 100, 30, cfg),
             up: P.totalPL(cfg.legs, 115, 30, cfg),
             dn: P.totalPL(cfg.legs, 85, 30, cfg) };
  }
  var base = calendar(0.35, 0.28, 0.28);
  c.eq('calendar net debit', base.debit, 0.69, 0.005);
  c.eq('calendar peak at strike', base.flat, 2.68, 0.005);
  c.eq('calendar return on debit %', 100 * base.flat / base.debit, 390, 3);
  c.prose('§11.2 states the debit', '$0.69');
  c.prose('§11.2 states the peak', '$2.68');
  c.prose('§11.2 states the return', '390%');

  /* §11.3 panic calendar: near 75%, far 55%, then far normalises to 25% */
  var held = calendar(0.75, 0.55, 0.55);
  var norm = calendar(0.75, 0.55, 0.25);
  c.eq('panic debit', held.debit, 0.47, 0.005);
  c.eq('panic peak (vol holds)', held.flat, 5.97, 0.005);
  c.eq('panic headline return %', 100 * held.flat / held.debit, 1277, 5);
  c.eq('panic +15% (vol holds)', held.up, 1.53, 0.005);
  c.eq('panic −15% (vol holds)', held.dn, 0.72, 0.005);
  c.eq('panic peak after normalising', norm.flat, 2.55, 0.005);
  c.eq('panic +15% after normalising', norm.up, -0.07, 0.005);
  c.eq('panic −15% after normalising', norm.dn, -0.44, 0.005);
  // ivNow must not rewrite the entry cost (both must equal the same debit)
  c.eq('ivNow leaves entry debit untouched', norm.debit, 0.47, 0.005);
  c.prose('§11.3 states the debit', '$0.47');
  c.prose('§11.3 states the headline', '1,277%');
  c.absent('stale 1,525% gone', '1,525');

  /* §11.4 PMCC illustrative structure at spot 100 */
  var cfgP = { spot0: 100, rate: r, legs: [
    { kind: 'call', side: 1, strike: 80, iv: 0.32, dte: 365 },
    { kind: 'call', side: -1, strike: 110, iv: 0.30, dte: 30 }] };
  var leaps = P.legPremium(cfgP.legs[0], cfgP), shortC = P.legPremium(cfgP.legs[1], cfgP);
  c.eq('LEAPS cost (prose $2,635 per contract)', leaps * 100, 2635, 5);
  c.eq('monthly premium (prose ≈$66)', shortC * 100, 66, 2);
  c.eq('yield on capital, classic CC %', 100 * shortC / 100, 0.66, 0.02);
  c.eq('yield on capital, PMCC %', 100 * shortC / leaps, 2.49, 0.03);
  c.eq('capital reduction %', 100 * (1 - leaps / 100), 74, 0.6);
  c.prose('§11.4 states LEAPS cost', '$2,635');
  c.prose('§11.4 states the yields', '0.66% → 2.49%');

  /* §11.4 NFLX case — the delta claims that were wrong on first writing */
  var rn = 0.02, S0 = 348.61, S1 = 226.19;
  var dPre = g.delta(S0, 250, 270 / 365, 0.55, rn, true);
  var dPost = g.delta(S1, 250, 269 / 365, 0.65, rn, true);
  c.eq('NFLX LEAPS delta before', dPre, 0.83, 0.01);
  c.eq('NFLX LEAPS delta after', dPost, 0.55, 0.01);
  c.prose('§11.4 states delta before', '0.83');
  c.prose('§11.4 states delta after', '0.55');
  c.absent('stale delta 0.9 claim gone', '接近 0.9');
  c.absent('stale delta 0.2 claim gone', '塌向 0.2');

  var vPre = P.bsPrice(S0, 250, 270 / 365, 0.55, rn, true);
  var vPost = P.bsPrice(S1, 250, 269 / 365, 0.65, rn, true);
  c.eq('NFLX LEAPS value before', vPre, 120.67, 0.01);
  c.eq('NFLX LEAPS value after', vPost, 42.44, 0.01);
  c.eq('NFLX LEAPS % change', 100 * (vPost / vPre - 1), -65, 0.6);
  c.prose('§11.4 states the values', '$120.67');
  c.prose('§11.4 states the drop', '−65%');

  // equal-capital comparison
  var sPre = P.bsPrice(S0, 380, 30 / 365, 0.70, rn, true);
  var sPost = P.bsPrice(S1, 380, 29 / 365, 0.60, rn, true);
  var capP = (vPre - sPre) * 100, capC = S0 * 100 - sPre * 100;
  var plP = ((vPost - vPre) - (sPost - sPre)) * 100;
  var plC = (S1 - S0) * 100 - (sPost - sPre) * 100;
  c.eq('PMCC capital', capP, 10442, 3);
  c.eq('CC capital', capC, 33236, 3);
  c.eq('PMCC P/L, 1 contract', plP, -6200, 3);
  c.eq('CC P/L, 1 contract', plC, -10619, 3);
  c.eq('PMCC scaled to equal capital', plP * (capC / capP), -19735, 20);
  c.eq('loss ratio on equal capital', (plP * (capC / capP)) / plC, 1.86, 0.01);
  c.prose('§11.4 states the equal-capital loss', '$19,735');
  c.prose('§11.4 states the ratio', '1.86');

  // NFLX real history
  c.eq('NFLX one-day drop %', 100 * (S1 / S0 - 1), -35.1, 0.05);
  c.prose('case states the drop', '35.1%');

  return c;
};
