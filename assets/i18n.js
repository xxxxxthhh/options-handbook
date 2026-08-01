/* Bilingual toggle: default zh; #en in URL hash switches to English. */
(function () {
  var root = document.documentElement;

  function setLang(lang, updateHash) {
    root.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    if (updateHash) {
      try { history.replaceState(null, '', lang === 'en' ? '#en' : location.pathname + location.search); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang, true); });
    });
    setLang(location.hash === '#en' ? 'en' : 'zh', false);

    // Keep #en on internal links so language follows navigation.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || root.getAttribute('data-lang') !== 'en') return;
      var href = a.getAttribute('href');
      if (href && !/^https?:|^#|#/.test(href)) a.setAttribute('href', href + '#en');
    });
  });
})();
