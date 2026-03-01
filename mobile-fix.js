/* ================================================================
   MOBILE FIX PATCH — mobile-fix.js
   Add AFTER script.js: <script src="mobile-fix.js"></script>

   Strategy: WRAPS the existing openCityPage / closeCityPage from
   script.js WITHOUT replacing their core logic.
   Only adds/removes body.city-page-open for CSS nav hiding.
   Does NOT touch mainContent.style.display at all.
   ================================================================ */

(function () {
  'use strict';

  /* ── Run after DOM + script.js are ready ───────────────────── */
  function init() {

    /* 1. Wrap openCityPage — original does all the work,
          we just add the body class so CSS hides navbar */
    var _origOpen = window.openCityPage;
    window.openCityPage = function (cityId) {

      // Run original function (shows cityPage, hides mainContent)
      if (typeof _origOpen === 'function') _origOpen.call(this, cityId);

      // Inject hero image if map exists
      if (window.CITY_HERO_IMAGES) {
        var imgData = window.CITY_HERO_IMAGES[cityId] || { src: '', alt: cityId };
        var imgEl = document.getElementById('cityHeroImg');
        if (imgEl) {
          imgEl.src = imgData.src;
          imgEl.alt = imgData.alt;
          imgEl.style.display = imgData.src ? 'block' : 'none';
        }
      }

      // Add class so CSS hides navbar on mobile
      document.body.classList.add('city-page-open');

      // Update back button text
      var cityPage = document.getElementById('cityPage');
      var backBtn = cityPage ? cityPage.querySelector('.city-back-btn') : null;
      if (backBtn) {
        backBtn.textContent = '← Back';
      }
    };

    /* 2. Wrap closeCityPage — original restores mainContent,
          we just remove the body class */
    var _origClose = window.closeCityPage;
    window.closeCityPage = function () {

      // Run original (hides cityPage, shows mainContent)
      if (typeof _origClose === 'function') _origClose.call(this);

      // Remove class so navbar reappears on mobile
      document.body.classList.remove('city-page-open');
    };

    /* 3. Fix place cards — set pointer-events so the card
          onclick fires even when children overlap */
    document.querySelectorAll('.place-card').forEach(function (card) {
      // Children should not intercept clicks
      card.querySelectorAll('.place-img-wrap, .place-img-wrap *, .place-info, .place-info *')
        .forEach(function (child) {
          child.style.pointerEvents = 'none';
        });
      card.style.pointerEvents = 'auto';
    });

    /* 4. Handle Android/iOS swipe-back / browser back button */
    window.addEventListener('popstate', function () {
      if (document.body.classList.contains('city-page-open')) {
        window.closeCityPage();
      }
    });

  } /* end init */

  /* Run after everything is loaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOMContentLoaded already fired (e.g., script at bottom of body)
    init();
  }

})();
