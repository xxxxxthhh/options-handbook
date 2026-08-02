/* Ch12 — every number the prose quotes, recomputed from the engine. */
module.exports = function (ctx) {
  var P = ctx.P;
  var c = new ctx.Checks('Ch.12 蝶式与结构工程', 'chapters/12-butterflies.html');
  var r = 0.04;

  /* §12.1 long butterfly 95/100/105, spot 100, 30d, IV 25% */
  var cfg = { spot0: 100, rate: r };
  var fly = [{ kind: 'call', side: 1, strike: 95, iv: 0.25, dte: 30 },
             { kind: 'call', side: -1, strike: 100, iv: 0.25, dte: 30, qty: 2 },
             { kind: 'call', side: 1, strike: 105, iv: 0.25, dte: 30 }];
  var debit = 0;
  fly.forEach(function (l) { debit += l.side * P.legPremium(l, cfg) * (l.qty || 1); });
  c.eq('butterfly net debit', debit, 1.33, 0.005);
  c.eq('butterfly max gain at $100', P.totalPL(fly, 100, 30, cfg), 3.67, 0.005);
  c.eq('max gain multiple of debit', P.totalPL(fly, 100, 30, cfg) / debit, 2.75, 0.01);
  c.prose('§12.1 states the multiple', '2.75');
  c.prose('§12.1 states the debit', '$1.33');
  c.prose('§12.1 states the max gain', '$3.67');

  // breakevens and the width of the profitable band
  var be = [];
  for (var s = 90; s <= 110; s += 0.005) {
    var a = P.totalPL(fly, s, 30, cfg), b = P.totalPL(fly, s + 0.005, 30, cfg);
    if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) be.push(s);
  }
  c.eq('lower breakeven', be[0], 96.33, 0.02);
  c.eq('upper breakeven', be[1], 103.66, 0.02);
  c.eq('profitable band width (points)', be[1] - be[0], 7.33, 0.03);
  c.prose('§12.1 states the breakevens', '$96.33');
  c.prose('§12.2 states the band width', '7.33');

  /* §12.2 the pinning-vs-band comparison that the whole debunk rests on */
  c.eq('band vs $0.25 pin definition', (be[1] - be[0]) / 0.25, 29, 0.5);
  c.prose('§12.2 states the 29x', '29');
  // the arithmetic that kills "8.2% is the win rate"
  c.eq('8.2% x max-gain multiple', 0.082 * (P.totalPL(fly, 100, 30, cfg) / debit), 0.23, 0.01);
  c.prose('§12.2 states that expectancy', '0.23');
  c.prose('§12.2 cites the pin rate', '8.2%');
  c.prose('§12.2 cites the knife-edge', '±$0.125');
  c.prose('§12.2 cites the basis points', '16.5');

  /* §12.2 equal-risk butterfly vs short straddle */
  var strad = [{ kind: 'call', side: -1, strike: 100, iv: 0.25, dte: 30 },
               { kind: 'put', side: -1, strike: 100, iv: 0.25, dte: 30 }];
  var n = (-P.totalPL(fly, 110, 30, cfg)) / (-P.totalPL(strad, 110, 30, cfg));
  c.eq('equal-risk scale (straddles per fly)', n, 0.311, 0.002);
  c.eq('at $100: butterfly', P.totalPL(fly, 100, 30, cfg), 3.67, 0.005);
  c.eq('at $100: scaled straddle', P.totalPL(strad, 100, 30, cfg) * n, 1.78, 0.01);
  c.eq('at $130: butterfly (capped)', P.totalPL(fly, 130, 30, cfg), -1.33, 0.005);
  c.eq('at $130: scaled straddle', P.totalPL(strad, 130, 30, cfg) * n, -7.56, 0.01);
  c.prose('§12.2 states the scale', '0.311');
  c.prose('§12.2 states the straddle payoff', '$1.78');
  c.prose('§12.2 states the $130 case', '$7.56');

  /* §12.3 the broken wing must actually open for a credit — the chart has to
     demonstrate the very pitch the section criticises. Max loss must equal
     (far width − near width) − credit. */
  var bwb = [{ kind: 'put', side: 1, strike: 96, iv: 0.26, dte: 30 },
             { kind: 'put', side: -1, strike: 93, iv: 0.29, dte: 30, qty: 2 },
             { kind: 'put', side: 1, strike: 85, iv: 0.34, dte: 30 }];
  var bwbCost = 0;
  bwb.forEach(function (l) { bwbCost += l.side * P.legPremium(l, cfg) * (l.qty || 1); });
  c.eq('broken wing opens for a credit', bwbCost, -0.16, 0.01);
  c.eq('broken wing worst case', P.totalPL(bwb, 80, 30, cfg), -4.84, 0.01);
  c.eq('worst case = width gap − credit', P.totalPL(bwb, 80, 30, cfg), -((8 - 3) + bwbCost), 0.01);
  c.eq('risk / credit ratio', P.totalPL(bwb, 80, 30, cfg) / bwbCost, 30, 1);
  c.prose('§12.3 states the credit', '$0.16');
  c.prose('§12.3 states the worst case', '$4.84');
  c.prose('§12.3 states the multiple', '30 倍');

  /* §12.4 the 2022-11-10 ratio-vs-butterfly case */
  var S0 = 374, S1 = 395, cfg0 = { spot0: S0, rate: r };
  var ratioLegs = [{ kind: 'call', side: 1, strike: 380, iv: 0.25, dte: 30 },
                   { kind: 'call', side: -1, strike: 390, iv: 0.24, dte: 30, qty: 2 }];
  var flyLegs = ratioLegs.concat([{ kind: 'call', side: 1, strike: 400, iv: 0.23, dte: 30 }]);
  function netCost(legs) {
    var t = 0; legs.forEach(function (l) { t += l.side * P.legPremium(l, cfg0) * (l.qty || 1); }); return t;
  }
  c.eq('ratio opens for a credit', netCost(ratioLegs), -0.87, 0.005);
  c.eq('butterfly opens for a debit', netCost(flyLegs), 1.38, 0.005);
  c.eq('the third leg costs (credit -> debit)', netCost(flyLegs) - netCost(ratioLegs), 2.25, 0.01);
  c.prose('§12.4 states the credit', '$0.87');
  c.prose('§12.4 states the debit', '$1.38');
  c.prose('§12.4 states the swing', '$2.25');

  // one-day mark: next session, 29 days left, IV down 3 points after the print
  function oneDay(legs) {
    var now = legs.map(function (l) { return Object.assign({}, l, { ivNow: l.iv - 0.03 }); });
    return P.totalPL(now, S1, 1, cfg0);
  }
  c.eq('ratio one-day P/L per unit', oneDay(ratioLegs), -4.76, 0.01);
  c.eq('butterfly one-day P/L per unit', oneDay(flyLegs), 0.18, 0.01);
  c.eq('ratio one-day, per contract set', oneDay(ratioLegs) * 100, -476, 1);
  c.eq('butterfly one-day, per contract set', oneDay(flyLegs) * 100, 18, 1);
  c.prose('§12.4 states the ratio loss', '$476');
  c.prose('§12.4 states the butterfly gain', '$18');

  // the unbounded side at expiry
  c.eq('ratio at SPY 420', P.totalPL(ratioLegs, 420, 30, cfg0), -19.13, 0.01);
  c.eq('ratio at SPY 500', P.totalPL(ratioLegs, 500, 30, cfg0), -99.13, 0.01);
  c.constant('butterfly capped 420/450/500',
    [P.totalPL(flyLegs, 420, 30, cfg0), P.totalPL(flyLegs, 450, 30, cfg0), P.totalPL(flyLegs, 500, 30, cfg0)],
    -1.38, 0.01);
  c.prose('§12.4 states the 500 case', '$99.13');
  c.prose('§12.4 states the fixed worst case', '$138');

  // real history quoted in the case
  c.prose('case cites the S&P gain', '5.54%');
  c.prose('case cites the S&P close', '3,956.37');
  c.prose('case cites the Nasdaq gain', '7.35%');

  /* §12.5 the design rule must not contradict Vol.1: a covered call is net
     short one option yet strictly bounded. Assert the bounded-ness. */
  var cc = [{ kind: 'stock', basis: 100 }, { kind: 'call', side: -1, strike: 110, iv: 0.25, dte: 30 }];
  var ccCfg = { spot0: 100, rate: r };
  c.constant('covered call is capped above 110',
    [P.totalPL(cc, 120, 30, ccCfg), P.totalPL(cc, 200, 30, ccCfg), P.totalPL(cc, 500, 30, ccCfg)],
    P.totalPL(cc, 120, 30, ccCfg), 0.005);
  c.prose('§12.5 lists the three covers', '足额现金');

  return c;
};
