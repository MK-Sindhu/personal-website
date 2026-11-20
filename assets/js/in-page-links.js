// In-page links (menu, buttons, skip link) scroll to their section without adding "#section" to the address bar
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    var behavior = reduce.matches ? 'auto' : 'smooth';
    if (target.id === 'top') window.scrollTo({ top: 0, behavior: behavior });
    else target.scrollIntoView({ behavior: behavior, block: 'start' });
    // move keyboard and screen-reader focus to the section as well
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();
