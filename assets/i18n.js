/* Bilingual toggle: default zh. Explicit #en in the URL wins (shareable links);
   otherwise the last choice is remembered in localStorage, so language follows
   navigation — including glossary term links, whose own #anchors used to defeat
   the old hash-rewriting approach. */
(function () {
  var root = document.documentElement;
  var KEY = 'handbook-lang';

  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

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
      b.addEventListener('click', function () {
        setLang(b.dataset.lang, true);
        save(b.dataset.lang);
      });
    });
    // Priority: explicit #en in the URL > saved preference > zh default.
    setLang(location.hash === '#en' ? 'en' : (saved() === 'en' ? 'en' : 'zh'), false);
  });
})();
