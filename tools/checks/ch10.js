/* Ch10 — every number the prose quotes, recomputed from the engine. */
module.exports = function (ctx) {
  var P = ctx.P;
  var c = new ctx.Checks('Ch.10 平价关系与合成头寸', 'chapters/10-parity-synthetics.html');

  var IV = 0.30, DTE = 91, T = DTE / 365, r = 0.04, S = 100;
  var base = { spot0: S, rate: r };

  // §10.1 parity itself: C - P must equal S - K*e^-rT exactly.
  c.eq('parity C-P at K=100', P.bsPrice(S, 100, T, IV, r, true) - P.bsPrice(S, 100, T, IV, r, false),
       S - 100 * Math.exp(-r * T), 1e-9);
  c.eq('parity C-P at K=110', P.bsPrice(S, 110, T, IV, r, true) - P.bsPrice(S, 110, T, IV, r, false),
       S - 110 * Math.exp(-r * T), 1e-9);

  // §10.2 covered call === short put, differing by a constant K(1-e^-rT).
  var cc = [{ kind: 'stock', basis: 100 }, { kind: 'call', side: -1, strike: 110, iv: IV, dte: DTE }];
  var sp = [{ kind: 'put', side: -1, strike: 110, iv: IV, dte: DTE }];
  var diffs = [];
  for (var s = 70; s <= 150; s += 1) diffs.push(P.totalPL(cc, s, DTE, base) - P.totalPL(sp, s, DTE, base));
  c.constant('CC − SP across $70-150', diffs, 110 * (1 - Math.exp(-r * T)), 0.001);
  c.eq('that constant vs prose $1.09', diffs[0], 1.09, 0.005);
  c.prose('§10.2 states it', '$1.09');

  // §10.3 the box is a zero-coupon bond: cost = PV(width).
  var box = [{ kind: 'call', side: 1, strike: 100, iv: IV, dte: DTE },
             { kind: 'call', side: -1, strike: 110, iv: IV, dte: DTE },
             { kind: 'put', side: 1, strike: 110, iv: IV, dte: DTE },
             { kind: 'put', side: -1, strike: 100, iv: IV, dte: DTE }];
  var boxCost = 0;
  box.forEach(function (l) { boxCost += l.side * P.legPremium(l, base); });
  c.eq('box cost = PV of $10', boxCost, 10 * Math.exp(-r * T), 0.005);
  c.eq('box cost vs prose $9.90', boxCost, 9.90, 0.005);
  c.prose('§10.3 states it', '$9.90');
  // flat payoff: P/L identical at every price
  var flat = [];
  for (s = 80; s <= 130; s += 2) flat.push(P.totalPL(box, s, DTE, base));
  c.constant('box P/L flat across $80-130', flat, 10 - boxCost, 0.005);

  // §10.5 JHEQX. Illustrative IVs declared in the chapter's 简化声明.
  var spot = 6475, Tq = 91 / 365;
  var LP = 6180, SP = 5210, SC = 6865, ivLP = 0.18, ivSP = 0.26, ivSC = 0.12;
  c.eq('JHEQX long put moneyness %', (LP / spot - 1) * 100, -4.6, 0.05);
  c.eq('JHEQX short put moneyness %', (SP / spot - 1) * 100, -19.5, 0.05);
  c.eq('JHEQX short call moneyness %', (SC / spot - 1) * 100, 6.0, 0.05);

  // two legs alone cost ~$44 — the reason a third leg is needed
  var twoLeg = P.bsPrice(spot, LP, Tq, ivLP, r, false) - P.bsPrice(spot, SC, Tq, ivSC, r, true);
  c.eq('two-leg collar cost', twoLeg, 44, 0.6);
  c.prose('§10.5 states it', '$44');

  // three-leg residual shown in the chart readout
  var three = twoLeg - P.bsPrice(spot, SP, Tq, ivSP, r, false);
  c.eq('three-leg net debit (chart readout)', three, 31.79, 0.05);
  c.prose('§10.5 mentions the residual', '约 $32 净支出');

  // the skew bill: zero-cost call strike with skew vs with flat IV
  function zeroCostK(a, b, d) {
    var cost = P.bsPrice(spot, LP, Tq, a, r, false) - P.bsPrice(spot, SP, Tq, b, r, false);
    var lo = spot, hi = spot * 1.5;
    for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; (P.bsPrice(spot, m, Tq, d, r, true) > cost) ? (lo = m) : (hi = m); }
    return (lo + hi) / 2;
  }
  var kSkew = zeroCostK(ivLP, ivSP, ivSC), kFlat = zeroCostK(0.16, 0.16, 0.16);
  c.eq('zero-cost call strike, with skew %', (kSkew / spot - 1) * 100, 4.0, 0.05);
  c.eq('zero-cost call strike, flat IV %', (kFlat / spot - 1) * 100, 7.2, 0.05);
  c.eq('skew bill, percentage points', (kFlat - kSkew) / spot * 100, 3.2, 0.05);
  c.prose('§10.5 states the bill', '3.2 个百分点');

  // collar protection profile (at expiry intrinsic, per the 简化声明)
  var collar = [{ kind: 'stock', basis: spot },
                { kind: 'put', side: 1, strike: LP, iv: ivLP, dte: 91 },
                { kind: 'put', side: -1, strike: SP, iv: ivSP, dte: 91 },
                { kind: 'call', side: -1, strike: SC, iv: ivSC, dte: 91 }];
  var cfgC = { spot0: spot, rate: r };
  function pctAt(level) {   // ignoring net-cost residual, as the chapter declares
    var legs = collar.map(function (l) { return l.kind === 'stock' ? l : Object.assign({}, l, { iv: undefined, dte: undefined, premium: 0 }); });
    return P.totalPL(legs, level, 91, cfgC) / spot * 100;
  }
  c.eq('collar floor at −19.5%', pctAt(SP), -4.6, 0.1);
  c.eq('collar at −25%', pctAt(spot * 0.75), -10.0, 0.15);
  c.prose('§10.5 states the floor', '−4.6%');
  c.prose('§10.5 states the −25% case', '−10.0%');

  // 1R0NYMAN is an anonymous, unaudited account. Validate the evidence boundary
  // and mechanism wording instead of re-proving its self-reported arithmetic.
  c.prose('case labels anonymous forum evidence', 'ANONYMOUS FORUM SELF-REPORT');
  c.prose('primary sources support mechanism only', 'Primary documents verify only the mechanism');
  c.prose('verdict refuses factual P/L finding', 'actual P/L are unaudited and are not factual findings');
  c.absent('no unsourced −2,000% claim as fact', '回报率 -2,000%');

  return c;
};
