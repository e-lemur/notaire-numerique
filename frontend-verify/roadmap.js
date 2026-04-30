/* Doc-Seal landing — Roadmap "Me prévenir" buttons.
 * No backend dependency: each click opens a pre-filled mailto so the user
 * tells us they want the service. We also persist the local state so the
 * button stays "Subscribed" on revisit.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "docseal.roadmap.votes";
  var CONTACT_EMAIL = "contact@doc-seal.com";

  var SUBJECTS = {
    fr: {
      "rgpd-vault": "Roadmap — RGPD vault",
      "bodacc": "Roadmap — BODACC veille",
      "rbe-inpi": "Roadmap — RBE Express INPI",
      "lcbft": "Roadmap — LCB-FT scan PEP",
      "oac": "Roadmap — OAC dashboard",
      "qualiopi": "Roadmap — Formation Qualiopi"
    },
    en: {
      "rgpd-vault": "Roadmap — GDPR vault",
      "bodacc": "Roadmap — BODACC monitoring",
      "rbe-inpi": "Roadmap — INPI beneficial ownership",
      "lcbft": "Roadmap — AML/CFT scan",
      "oac": "Roadmap — Active obligations dashboard",
      "qualiopi": "Roadmap — Qualiopi training"
    }
  };

  var BODY = {
    fr:
      "Bonjour,%0D%0A%0D%0AJe souhaite être prévenu(e) en priorité de la sortie du module : %SERVICE%.%0D%0A%0D%0ANom :%0D%0ACabinet :%0D%0ATéléphone :%0D%0A%0D%0AMerci.",
    en:
      "Hello,%0D%0A%0D%0APlease notify me as a priority when this module ships: %SERVICE%.%0D%0A%0D%0AName:%0D%0AFirm:%0D%0APhone:%0D%0A%0D%0AThank you."
  };

  function loadVotes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveVote(serviceKey) {
    try {
      var votes = loadVotes();
      votes[serviceKey] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
    } catch (e) {
      /* ignore */
    }
  }

  function currentLang() {
    var l = (document.documentElement.lang || "fr").toLowerCase();
    return l.indexOf("en") === 0 ? "en" : "fr";
  }

  function refreshButtonState(btn, serviceKey, lang) {
    var votes = loadVotes();
    var voted = !!votes[serviceKey];
    btn.classList.toggle("is-voted", voted);
    btn.disabled = voted;
    var labels = {
      fr: { vote: "Me prévenir", voted: "Inscrit ✓" },
      en: { vote: "Notify me", voted: "Subscribed ✓" }
    };
    var l = labels[lang] || labels.fr;
    btn.textContent = voted ? l.voted : l.vote;
  }

  function init() {
    var buttons = document.querySelectorAll(".service-vote");
    if (!buttons.length) return;

    var lang = currentLang();
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var card = btn.closest(".service");
      if (!card) continue;
      var serviceKey = card.getAttribute("data-service");
      if (!serviceKey) continue;

      refreshButtonState(btn, serviceKey, lang);

      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var b = ev.currentTarget;
        var c = b.closest(".service");
        var sk = c.getAttribute("data-service");
        var l = currentLang();
        var subjects = SUBJECTS[l] || SUBJECTS.fr;
        var subject = encodeURIComponent(subjects[sk] || sk);
        var body = (BODY[l] || BODY.fr).replace(
          "%SERVICE%",
          subjects[sk] || sk
        );
        var href =
          "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
        saveVote(sk);
        refreshButtonState(b, sk, l);
        window.location.href = href;
      });
    }

    // Refresh button labels when the language is toggled.
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t && t.classList && t.classList.contains("lang-btn")) {
        // Defer until i18n.js has applied the new lang.
        setTimeout(function () {
          var newLang = currentLang();
          var btns = document.querySelectorAll(".service-vote");
          for (var j = 0; j < btns.length; j++) {
            var c = btns[j].closest(".service");
            if (!c) continue;
            refreshButtonState(btns[j], c.getAttribute("data-service"), newLang);
          }
        }, 0);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
