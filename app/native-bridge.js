/* COATNEWS iOS köprüsü: yalnızca uygulama içinde (Capacitor) çalışır, web sitesini etkilemez. */
(function () {
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  var P = C.Plugins || {};

  // Dış haber linklerini uygulama içi Safari görünümünde aç
  window.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[target="_blank"], a[href^="http"]');
    if (a && P.Browser && /^https?:/i.test(a.href)) {
      e.preventDefault();
      e.stopPropagation();
      P.Browser.open({ url: a.href, presentationStyle: "popover" });
      return;
    }
    // "Linki kopyala" yerine iOS paylaş menüsü
    var c = e.target.closest && e.target.closest("[data-copy]");
    if (c && P.Share) {
      e.preventDefault();
      e.stopPropagation();
      var url = c.dataset.copy;
      P.Share.share({ title: "COATNEWS", url: url, dialogTitle: "Haberi paylaş" }).catch(function () {});
    }
  }, true);

  if (P.StatusBar) { try { P.StatusBar.setStyle({ style: "DARK" }); } catch (_) {} }
  if (P.SplashScreen) {
    window.addEventListener("load", function () { try { P.SplashScreen.hide(); } catch (_) {} });
  }
})();
