#!/bin/sh
# Every automated check the handbook has. Run from the repo root:  sh tools/check-all.sh
# Exits non-zero if anything fails, so it can gate a commit.
set -e
cd "$(dirname "$0")/.."

echo "=== JS syntax ==="
for f in assets/*.js tools/*.js tools/checks/*.js; do node --check "$f"; done
echo "all JS parses"

echo
echo "=== structural QA (bilingual / anchors / links / charts / quizzes / cases) ==="
node tools/qa.js | tail -3

echo
echo "=== Vol.1 engine regression ==="
node tools/regress.js

echo
echo "=== Vol.2 figure verification ==="
node tools/figures.js | tail -3

echo
echo "ALL CHECKS PASSED"
