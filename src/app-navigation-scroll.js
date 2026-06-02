function goTopSoon() {
  setTimeout(function () {
    window.scrollTo(0, 0);
  }, 80);
}

function installNavigationScroll() {
  document.addEventListener('click', function (event) {
    var item = event.target && event.target.closest ? event.target.closest('.bottom-app-nav button, .desktop-nav button, .here-brand') : null;
    if (item) goTopSoon();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installNavigationScroll);
} else {
  installNavigationScroll();
}
