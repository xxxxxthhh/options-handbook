/* Mutation test for the gates themselves.  Run: node tools/mutate.js
   Each case copies the repo to a temp dir, injects one known defect, and
   expects the named checker to FAIL. A mutation that still passes means the
   gate has a blind spot — its "all green" would not count. */
var fs = require('fs'), path = require('path'), os = require('os');
var cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var CH01 = 'chapters/01-what-is-an-option.html';
var VIX = 'data: [16.6, 13.1, 16.1, 12.3, 18.8, 40.1, 53.5, 30.4, 26.4, 22.8]';
var CH15 = 'chapters/15-evidence.html';

var CASES = [
  { name: 'CaseChart series value is null',
    file: CH01, from: VIX, to: 'data: [16.6, null, 16.1, 12.3, 18.8, 40.1, 53.5, 30.4, 26.4, 22.8]' },
  { name: 'CaseChart series value is a numeric string',
    file: CH01, from: VIX, to: "data: [16.6, '13.1', 16.1, 12.3, 18.8, 40.1, 53.5, 30.4, 26.4, 22.8]" },
  { name: 'CaseChart series value is NaN',
    file: CH01, from: VIX, to: 'data: [16.6, NaN, 16.1, 12.3, 18.8, 40.1, 53.5, 30.4, 26.4, 22.8]' },
  { name: 'CaseChart series shorter than its labels',
    file: CH01, from: VIX, to: 'data: [16.6, 13.1, 16.1, 12.3, 18.8, 40.1, 53.5, 30.4, 26.4]' },
  { name: 'CaseChart with a single point (Ch14 0DTE regression)',
    file: CH01,
    from: "labels: ['19-01', '19-04', '19-07', '19-10', '20-01', '20-02', '20-03', '20-06', '20-09', '20-12'],\n    series: [\n      { name: { zh: 'VIX', en: 'VIX' }, color: '#D99A3D', " + VIX + ' }',
    to: "labels: ['19-01'],\n    series: [\n      { name: { zh: 'VIX', en: 'VIX' }, color: '#D99A3D', data: [16.6] }" },
  { name: 'Ch15 BXM return reverted to the retired 2026-06 snapshot (8.6% -> 8.5%)',
    tool: 'tools/figures.js', file: CH15,
    from: '<span class="zh">BXM <strong>8.6%</strong> · 标普全收益', to: '<span class="zh">BXM <strong>8.5%</strong> · 标普全收益' }
];

function copyRepo() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'options-mutate-'));
  ['index.html', 'glossary.html', 'sources.html'].forEach(function (f) {
    fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  });
  ['chapters', 'assets', 'tools'].forEach(function (d) {
    fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  });
  return dir;
}

var survived = 0;
CASES.forEach(function (c) {
  var dir = copyRepo();
  try {
    var p = path.join(dir, c.file), src = fs.readFileSync(p, 'utf8');
    if (src.indexOf(c.from) === -1) throw new Error('mutation did not apply (source changed?)');
    fs.writeFileSync(p, src.replace(c.from, c.to));
    var r = cp.spawnSync('node', [path.join(dir, c.tool || 'tools/qa.js')], { encoding: 'utf8' });
    var killed = r.status !== 0;
    if (!killed) survived++;
    console.log((killed ? '  KILL  ' : '  ALIVE ') + c.name);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
console.log(CASES.length - survived + ' killed, ' + survived + ' survived');
process.exit(survived ? 1 : 0);
