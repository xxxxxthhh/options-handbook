/* Structural QA for every page.  Run: node tools/qa.js
   Checks the conventions CLAUDE.md declares as 硬性约定. */
var L = require('./lib'), fs = require('fs'), path = require('path');

var CJK = /[一-鿿　-〿＀-￯]/;
var fails = 0;
function bad(msg) { console.log('  FAIL ' + msg); fails++; }

var gloss = L.read('glossary.html');
var anchors = {};
(gloss.match(/id="([^"]+)"/g) || []).forEach(function (m) { anchors[m.slice(4, -1)] = true; });

// Inner text of every <span class="X">, nesting-aware.
function spans(html, cls) {
  var open = '<span class="' + cls + '">', out = [], i = 0;
  while ((i = html.indexOf(open, i)) !== -1) {
    var j = i + open.length, depth = 1, start = j;
    while (depth > 0 && j < html.length) {
      var nx = html.indexOf('<span', j), cl = html.indexOf('</span>', j);
      if (cl === -1) break;
      if (nx !== -1 && nx < cl) { depth++; j = nx + 5; } else { depth--; j = cl + 7; }
    }
    out.push(html.slice(start, j - 7));
    i = start;
  }
  return out;
}

L.pages().forEach(function (rel) {
  var html = L.read(rel);
  console.log('\n' + rel);

  if (rel === 'sources.html') {
    for (var sourceChapter = 1; sourceChapter <= 15; sourceChapter++) {
      var sourceId = 'ch' + String(sourceChapter).padStart(2, '0');
      var sourceSection = html.match(new RegExp('<section id="' + sourceId + '">([\\s\\S]*?)<\\/section>'));
      if (!sourceSection) {
        bad('sources page missing chapter mapping #' + sourceId);
        continue;
      }
      var sourceHeading = sourceSection[1].match(/<h3>([\s\S]*?)<\/h3>/);
      if (!sourceHeading) {
        bad('sources page missing chapter heading #' + sourceId);
        continue;
      }
      var sourceZh = /<span class="zh">[^<]+<\/span>/.test(sourceHeading[1]);
      var sourceEn = /<span class="en">[^<]+<\/span>/.test(sourceHeading[1]);
      if (!sourceZh || !sourceEn)
        bad('sources chapter heading must contain non-empty zh and en labels #' + sourceId);
    }
    var publicLinks = (html.match(/href="https:\/\//g) || []).length;
    if (publicLinks < 15) bad('sources page has fewer than 15 public HTTPS links');
    if (html.indexOf('https://cdn.cboe.com/resources/education/research_publications/PUTIndexEnnisKnupp.pdf') === -1)
      bad('sources page missing direct PUT performance-study source');
    if (html.indexOf('https://www.cboe.com/us/indices/dashboard/put/') !== -1)
      bad('sources page still uses non-resolving PUT dashboard');
    if (html.indexOf('https://www.proshares.com/our-etfs/strategic/uvxy') === -1 ||
        html.indexOf('https://www.cboe.com/exchange-traded-stock') === -1)
      bad('sources page missing primary UVXY/ETP exercise-style evidence');
  }

  // 1. bilingual pairing
  var zh = (html.match(/<span class="zh">/g) || []).length;
  var en = (html.match(/<span class="en">/g) || []).length;
  console.log('  zh=' + zh + ' en=' + en + (zh === en ? '  ok' : ''));
  if (zh !== en) bad('zh/en span counts differ by ' + (zh - en));

  // 2. equal counts cannot catch a block that is bilingual in name only
  spans(html, 'en').forEach(function (t) {
    var s = t.replace(/<[^>]+>/g, '');
    if (CJK.test(s)) bad('CJK inside class="en": ' + s.slice(0, 60).trim());
  });
  spans(html, 'zh').forEach(function (t) {
    var s = t.replace(/<[^>]+>/g, '').trim();
    if (s.length > 25 && !CJK.test(s)) bad('no CJK in class="zh": ' + s.slice(0, 60));
  });

  // 3. glossary anchors resolve (cross-page and glossary-internal)
  var seen = {};
  (html.match(/href="(?:\.\.\/)?glossary\.html#([^"]+)"/g) || []).forEach(function (m) {
    var id = m.match(/#([^"]+)"/)[1];
    if (seen[id]) return; seen[id] = 1;
    if (!anchors[id]) bad('dangling glossary anchor #' + id);
  });
  if (rel === 'glossary.html') {
    (html.match(/href="#([^"]+)"/g) || []).forEach(function (m) {
      var id = m.match(/#([^"]+)"/)[1];
      if (!anchors[id]) bad('dangling glossary-internal anchor #' + id);
    });
  }
  console.log('  glossary refs: ' + Object.keys(seen).length + ' distinct');

  // 4. internal links point at files that exist
  if (/^chapters\//.test(rel)) {
    var topbar = html.match(/<header class="topbar">([\s\S]*?)<\/header>/);
    if (!topbar || topbar[1].indexOf('href="../sources.html"') === -1)
      bad('chapter topbar navigation missing Sources ledger');
  }
  (html.match(/href="([^"#:]+\.html)[^"]*"/g) || []).forEach(function (m) {
    var href = m.match(/href="([^"#:]+\.html)/)[1];
    if (!fs.existsSync(path.resolve(path.dirname(path.join(L.ROOT, rel)), href)))
      bad('link target missing: ' + href);
  });

  // 5. every mount has a container and every container is mounted
  var mounts = (html.match(/(?:Payoff|CaseChart)\.mount\('([^']+)'/g) || [])
    .map(function (m) { return m.match(/'([^']+)'/)[1]; });
  mounts.forEach(function (id) {
    if (html.indexOf('id="' + id + '"') === -1) bad('mount() with no container div: ' + id);
  });
  (html.match(/<div id="(pf-|case-)[^"]+"/g) || []).forEach(function (m) {
    var id = m.match(/id="([^"]+)"/)[1];
    if (mounts.indexOf(id) === -1) bad('container div never mounted: ' + id);
  });
  if (mounts.length) console.log('  charts: ' + mounts.length);

  // 6. quiz answers must exist and be explained
  var quizzes = html.split('<div class="quiz" data-answer=').slice(1);
  quizzes.forEach(function (q, n) {
    var ans = q.match(/^"([a-d])"/);
    if (!ans) { bad('quiz ' + (n + 1) + ' has no answer letter'); return; }
    var block = q.slice(0, q.indexOf('</div>\n</div>') + 1);
    if (block.indexOf('data-opt="' + ans[1] + '"') === -1)
      bad('quiz ' + (n + 1) + ' answer "' + ans[1] + '" has no matching option');
    if (block.indexOf('class="expl"') === -1) bad('quiz ' + (n + 1) + ' has no explanation');
  });
  if (quizzes.length) console.log('  quizzes: ' + quizzes.length);

  // 7. every case card carries a tag and a quantified verdict
  var cases = html.split('<div class="case">').slice(1);
  cases.forEach(function (c, n) {
    var body = c.slice(0, c.indexOf('<div class="think"') + 1 || c.length);
    if (!/class="verdict (gain|loss)"/.test(body)) bad('case ' + (n + 1) + ' has no .verdict gain|loss');
    if (!/case-tag/.test(body)) bad('case ' + (n + 1) + ' has no case-tag');
  });
  if (cases.length) console.log('  cases: ' + cases.length);
});

console.log('\n' + (fails ? fails + ' FAILURE(S)' : 'all structural checks passed'));
process.exit(fails ? 1 : 0);
