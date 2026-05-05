/*!
 * EuroAnalytics tracker — privacy-first, zero cookies, zero localStorage.
 * Loads with: <script src="https://your-domain/script.js" defer></script>
 */
(function () {
  "use strict";

  if (typeof window === "undefined" || !window.fetch) return;

  // Resolve API base from the <script> tag that loaded us, so customers can
  // self-host the dashboard and the tracker still posts to the right origin.
  function resolveBase() {
    try {
      var s = document.currentScript;
      if (s && s.src) return new URL(s.src).origin;
    } catch (_) {}
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("/script.js") !== -1) {
        try { return new URL(src).origin; } catch (_) {}
      }
    }
    return ""; // same-origin fallback
  }

  function deviceType() {
    var ua = navigator.userAgent || "";
    return /Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua)
      ? "mobile"
      : "desktop";
  }

  function send() {
    // Strip query strings and hashes — we only need the page identity.
    var loc = window.location;
    var url = loc.protocol + "//" + loc.host + loc.pathname;
    var payload = {
      url: url,
      referrer: document.referrer || null,
      device_type: deviceType(),
    };

    var endpoint = resolveBase() + "/api/collect";
    var body = JSON.stringify(payload);

    // Prefer sendBeacon for reliability on page unload; fall back to fetch.
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) return;
      } catch (_) {}
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).catch(function () {
      // Silent — analytics must never break the host page.
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(send, 0);
  } else {
    window.addEventListener("DOMContentLoaded", send, { once: true });
  }
})();
