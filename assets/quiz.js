/* Multiple-choice quiz: click an option → instant feedback + explanation. */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.quiz').forEach(function (q) {
      var answer = q.dataset.answer;
      q.querySelectorAll('.opts button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (q.classList.contains('answered')) return;
          q.classList.add('answered');
          if (btn.dataset.opt !== answer) btn.classList.add('wrong');
          q.querySelectorAll('.opts button').forEach(function (b) {
            if (b.dataset.opt === answer) b.classList.add('correct');
            b.disabled = true;
          });
        });
      });
    });
  });
})();
