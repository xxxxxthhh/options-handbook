#!/bin/sh
# Every automated check the handbook has. Run from the repo root:  sh tools/check-all.sh
# Exits non-zero if anything fails, so it can gate a commit.
set -e
cd "$(dirname "$0")/.."

echo "=== JS syntax ==="
for f in assets/*.js tools/*.js tools/checks/*.js; do node --check "$f"; done
echo "all JS parses"

# NOTE: never pipe these into tail — a pipeline's exit status is the LAST
# command's, so `node tools/qa.js | tail -3` reports success even when qa.js
# fails. Capture output, then print a summary.
run() {                      # run <label> <script>
  echo
  echo "=== $1 ==="
  out=$(node "$2") || { echo "$out"; echo "^^ $1 FAILED"; exit 1; }
  echo "$out" | tail -3
}

run "structural QA (bilingual / anchors / links / charts / quizzes / cases)" tools/qa.js
run "Vol.1 engine regression" tools/regress.js
run "Vol.2 figure verification" tools/figures.js

echo
echo "ALL CHECKS PASSED"
