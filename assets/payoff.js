/* ============================================================
   Payoff — declarative expiry-payoff diagrams with sliders
   CaseChart — small line chart for historical case studies
   All SVG, no dependencies. Axis labels are bilingual inline.
   ============================================================ */

var Payoff = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Per-share P/L of one leg at expiry, price S.
  function legPL(leg, S) {
    var q = leg.qty || 1;
    if (leg.kind === 'stock') return (S - leg.basis) * q;
    var intr = leg.kind === 'call' ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
    return leg.side * (intr - leg.premium) * q; // side: +1 long, -1 short
  }

  function totalPL(legs, S) {
    var v = 0;
    for (var i = 0; i < legs.length; i++) v += legPL(legs[i], S);
    return v;
  }

  function fmt(x) {
    var a = Math.abs(x);
    var s = a >= 100 ? x.toFixed(0) : x.toFixed(2).replace(/\.?0+$/, '');
    return (x > 0 ? '+' : '') + s;
  }

  function breakevens(legs, lo, hi) {
    var out = [], n = 400, prev = totalPL(legs, lo);
    for (var i = 1; i <= n; i++) {
      var S = lo + (hi - lo) * i / n, v = totalPL(legs, S);
      if ((prev < 0 && v >= 0) || (prev > 0 && v <= 0)) {
        var a = lo + (hi - lo) * (i - 1) / n, b = S;
        for (var j = 0; j < 30; j++) {
          var m = (a + b) / 2;
          (totalPL(legs, a) * totalPL(legs, m) <= 0) ? (b = m) : (a = m);
        }
        out.push((a + b) / 2);
      }
      prev = v;
    }
    return out;
  }

  function render(container, cfg) {
    container.innerHTML = '';
    var W = 660, H = 300, M = { l: 52, r: 16, t: 14, b: 34 };
    var lo = cfg.range[0], hi = cfg.range[1];

    var ys = [];
    for (var i = 0; i <= 200; i++) ys.push(totalPL(cfg.legs, lo + (hi - lo) * i / 200));
    var yMax = Math.max.apply(null, ys.map(Math.abs).concat([1])) * 1.15;

    var X = function (S) { return M.l + (S - lo) / (hi - lo) * (W - M.l - M.r); };
    var Y = function (v) { return M.t + (yMax - v) / (2 * yMax) * (H - M.t - M.b); };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, container);

    // grid + x ticks
    var ticks = 5;
    for (i = 0; i <= ticks; i++) {
      var S = lo + (hi - lo) * i / ticks;
      el('line', { x1: X(S), x2: X(S), y1: M.t, y2: H - M.b, stroke: '#1E313E', 'stroke-width': 1 }, svg);
      el('text', { x: X(S), y: H - M.b + 18, fill: '#6E8494', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono,monospace' }, svg)
        .textContent = S >= 100 ? S.toFixed(0) : S.toFixed(1);
    }
    // y ticks
    [-yMax * 0.8, -yMax * 0.4, yMax * 0.4, yMax * 0.8].forEach(function (v) {
      el('text', { x: M.l - 8, y: Y(v) + 4, fill: '#6E8494', 'font-size': 11, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono,monospace' }, svg)
        .textContent = fmt(v);
    });

    // profit / loss shading via clip paths
    var uid = 'pf' + Math.random().toString(36).slice(2, 8);
    var defs = el('defs', {}, svg);
    var cAbove = el('clipPath', { id: uid + 'a' }, defs);
    el('rect', { x: M.l, y: M.t, width: W - M.l - M.r, height: Y(0) - M.t }, cAbove);
    var cBelow = el('clipPath', { id: uid + 'b' }, defs);
    el('rect', { x: M.l, y: Y(0), width: W - M.l - M.r, height: H - M.b - Y(0) }, cBelow);

    var area = 'M' + X(lo) + ' ' + Y(0);
    var line = '';
    for (i = 0; i <= 200; i++) {
      S = lo + (hi - lo) * i / 200;
      var px = X(S), py = Y(Math.max(-yMax, Math.min(yMax, ys[i])));
      area += ' L' + px + ' ' + py;
      line += (i ? ' L' : 'M') + px + ' ' + py;
    }
    area += ' L' + X(hi) + ' ' + Y(0) + ' Z';

    el('path', { d: area, fill: 'rgba(60,223,163,.16)', 'clip-path': 'url(#' + uid + 'a)' }, svg);
    el('path', { d: area, fill: 'rgba(255,106,85,.16)', 'clip-path': 'url(#' + uid + 'b)' }, svg);
    el('path', { d: line, fill: 'none', stroke: '#3CDFA3', 'stroke-width': 2.25, 'clip-path': 'url(#' + uid + 'a)' }, svg);
    el('path', { d: line, fill: 'none', stroke: '#FF6A55', 'stroke-width': 2.25, 'clip-path': 'url(#' + uid + 'b)' }, svg);

    // zero line
    el('line', { x1: M.l, x2: W - M.r, y1: Y(0), y2: Y(0), stroke: '#5B6B76', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);

    // breakevens
    var bes = breakevens(cfg.legs, lo, hi);
    bes.forEach(function (b) {
      el('circle', { cx: X(b), cy: Y(0), r: 4, fill: '#D99A3D' }, svg);
      el('text', { x: X(b), y: Y(0) - 9, fill: '#D99A3D', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono,monospace' }, svg)
        .textContent = 'BE ' + (b >= 100 ? b.toFixed(0) : b.toFixed(2));
    });

    // strike markers
    cfg.legs.forEach(function (l) {
      if (l.kind === 'stock') return;
      el('line', { x1: X(l.strike), x2: X(l.strike), y1: M.t, y2: H - M.b, stroke: '#D99A3D', 'stroke-width': 1, 'stroke-dasharray': '2 5', opacity: .8 }, svg);
    });

    // axis captions (bilingual inline)
    el('text', { x: W - M.r, y: H - 6, fill: '#8FA6B4', 'font-size': 11, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono,monospace' }, svg)
      .textContent = (cfg.xlabel || '到期股价 Price at expiry');
    el('text', { x: 12, y: M.t + 2, fill: '#8FA6B4', 'font-size': 11, 'font-family': 'IBM Plex Mono,monospace', transform: 'rotate(-90 12 ' + (M.t + 2) + ')', 'text-anchor': 'end' }, svg)
      .textContent = (cfg.ylabel || '每股盈亏 P/L per share');

    // readout
    if (cfg.readout) {
      var maxV = Math.max.apply(null, ys), minV = Math.min.apply(null, ys);
      var maxTxt = (Math.abs(ys[200] - maxV) < 1e-9 && ys[200] > 0 && slope(cfg.legs, hi) > 0.01) ? '∞' : fmt(maxV);
      cfg.readout.innerHTML =
        '<span>Max gain <b class="g">' + maxTxt + '</b></span>' +
        '<span>Max loss <b class="r">' + fmt(minV) + '</b></span>' +
        '<span>Breakeven <b>' + (bes.length ? bes.map(function (b) { return b >= 100 ? b.toFixed(0) : b.toFixed(2); }).join(' / ') : '—') + '</b></span>';
    }
  }

  function slope(legs, S) {
    return (totalPL(legs, S + 0.01) - totalPL(legs, S - 0.01)) / 0.02;
  }

  // Mount: builds sliders from cfg.controls, re-renders on input.
  function mount(rootId, cfg) {
    var root = document.getElementById(rootId);
    if (!root) return;
    var chart = document.createElement('div');
    root.appendChild(chart);
    var readout = document.createElement('div');
    readout.className = 'readout';
    root.appendChild(readout);
    cfg.readout = readout;

    if (cfg.controls && cfg.controls.length) {
      var ctrls = document.createElement('div');
      ctrls.className = 'controls';
      cfg.controls.forEach(function (c) {
        var wrap = document.createElement('div');
        wrap.className = 'ctrl';
        var val = cfg.legs[c.leg][c.prop];
        wrap.innerHTML =
          '<label><span>' +
          '<span class="zh">' + c.label.zh + '</span><span class="en">' + c.label.en + '</span>' +
          '</span><output>' + val + '</output></label>' +
          '<input type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + val + '">';
        var input = wrap.querySelector('input'), out = wrap.querySelector('output');
        input.addEventListener('input', function () {
          cfg.legs[c.leg][c.prop] = parseFloat(input.value);
          out.textContent = input.value;
          render(chart, cfg);
        });
        ctrls.appendChild(wrap);
      });
      root.appendChild(ctrls);
    }
    render(chart, cfg);
  }

  return { mount: mount };
})();

/* ---------- CaseChart: price / portfolio-value line chart ---------- */
var CaseChart = (function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // cfg: { labels:[...x labels], series:[{name:{zh,en}, color, data:[...] , dash?}], events:[{i,text:{zh,en}}], yfmt? }
  function mount(rootId, cfg) {
    var root = document.getElementById(rootId);
    if (!root) return;
    var W = 660, H = 300, M = { l: 56, r: 16, t: 16, b: 46 };
    var all = [];
    cfg.series.forEach(function (s) { all = all.concat(s.data); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var n = cfg.labels.length;
    var X = function (i) { return M.l + i / (n - 1) * (W - M.l - M.r); };
    var Y = function (v) { return M.t + (hi - v) / (hi - lo) * (H - M.t - M.b); };
    var yfmt = cfg.yfmt || function (v) { return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0); };

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, root);

    for (var g = 0; g <= 4; g++) {
      var v = lo + (hi - lo) * g / 4;
      el('line', { x1: M.l, x2: W - M.r, y1: Y(v), y2: Y(v), stroke: '#1E313E' }, svg);
      el('text', { x: M.l - 8, y: Y(v) + 4, fill: '#6E8494', 'font-size': 11, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono,monospace' }, svg).textContent = yfmt(v);
    }
    var step = Math.max(1, Math.round((n - 1) / 6));
    for (var i = 0; i < n; i += step) {
      el('text', { x: X(i), y: H - M.b + 18, fill: '#6E8494', 'font-size': 10.5, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono,monospace' }, svg).textContent = cfg.labels[i];
    }

    cfg.series.forEach(function (s) {
      var d = '';
      s.data.forEach(function (v, i) { d += (i ? ' L' : 'M') + X(i) + ' ' + Y(v); });
      el('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': 2.25, 'stroke-dasharray': s.dash || 'none' }, svg);
    });

    (cfg.events || []).forEach(function (ev) {
      el('line', { x1: X(ev.i), x2: X(ev.i), y1: M.t, y2: H - M.b, stroke: '#D99A3D', 'stroke-dasharray': '2 5' }, svg);
      var t = el('text', { x: X(ev.i) + 5, y: M.t + 12, fill: '#D99A3D', 'font-size': 10.5, 'font-family': 'IBM Plex Mono,monospace' }, svg);
      var z = el('tspan', { 'class': 'zh' }, t); z.textContent = ev.text.zh;
      var e2 = el('tspan', { 'class': 'en' }, t); e2.textContent = ev.text.en;
    });

    // legend
    var lx = M.l;
    cfg.series.forEach(function (s) {
      el('rect', { x: lx, y: H - 14, width: 14, height: 3, fill: s.color }, svg);
      var t = el('text', { x: lx + 20, y: H - 9, fill: '#C8D6DE', 'font-size': 11, 'font-family': 'IBM Plex Mono,monospace' }, svg);
      var z = el('tspan', { 'class': 'zh' }, t); z.textContent = s.name.zh;
      var e2 = el('tspan', { 'class': 'en' }, t); e2.textContent = s.name.en;
      lx += 20 + Math.max(s.name.zh.length * 12, s.name.en.length * 7) + 24;
    });
  }
  return { mount: mount };
})();
