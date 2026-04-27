/* Doc-Seal landing — i18n module (FR/EN, vanilla JS, no framework). */
(function () {
  "use strict";

  var STORAGE_KEY = "docseal.lang";
  var DEFAULT_LANG = "fr";

  var TRANSLATIONS = {
    fr: {
      "html.lang": "fr",
      "html.title": "Doc-Seal — Conformité notariale et juridique par cryptographie",
      "html.description":
        "Doc-Seal est l'outil compliance natif des notaires et avocats français. Sealing cryptographique, RGPD, LCB-FT, RBE — automatisés. Privacy by design : nous ne voyons jamais vos documents.",
      "lang.toggle.aria": "Changer la langue",
      "lang.fr": "FR",
      "lang.en": "EN",
      "nav.fonctionnement": "Fonctionnement",
      "nav.piliers": "Pourquoi Doc-Seal",
      "nav.bientot": "Roadmap",
      "nav.tarifs": "Tarifs",
      "nav.verifier": "Vérifier un document",
      "nav.demarrer": "Démarrer",
      "hero.eyebrow": "Pour notaires, avocats et cabinets juridiques internationaux",
      "hero.h1.html":
        "L'outil compliance natif des notaires<br />et avocats français.",
      "hero.lede.html":
        "Sealing cryptographique, RGPD, LCB-FT et bénéficiaires effectifs — réunis dans un seul tableau de bord. <strong>Privacy by design</strong> : l'empreinte SHA-256 est calculée dans votre navigateur, le contenu de vos documents ne quitte jamais votre poste.",
      "hero.cta.primary": "Sceller mon premier document",
      "hero.cta.secondary": "Vérifier un document reçu",
      "hero.trust.1": "SHA-256 calculé côté navigateur",
      "hero.trust.2": "Hash-chain append-only",
      "hero.trust.3": "Compatible avec un ancrage on-chain",
      "hero.card.title": "Certificat de Fiducité Numérique",
      "hero.card.fingerprint": "Empreinte SHA-256",
      "hero.card.sealed": "Scellé le",
      "hero.card.sealed.value": "25 avril 2026 — 14:32 UTC",
      "hero.card.chain": "Index de chaîne",
      "hero.card.status": "Statut",
      "hero.card.status.value": "✓ Authentique",
      "hero.card.scan": "Scannez pour vérifier",
      "piliers.h2.html": "Trois principes, une garantie&nbsp;: l'intégrité.",
      "piliers.1.title": "Zero-knowledge par défaut",
      "piliers.1.body.html":
        "Le contenu de vos fichiers ne quitte jamais votre appareil. Seule l'empreinte SHA-256 (64&nbsp;caractères) est transmise. <strong>Le secret professionnel est préservé par construction, pas par promesse contractuelle.</strong>",
      "piliers.2.title": "Antériorité incontestable",
      "piliers.2.body.html":
        "Chaque scellement est inscrit dans une hash-chain <em>append-only</em>. Une modification d'un seul octet du document original produit une empreinte différente et <strong>invalide automatiquement le certificat</strong>. Aucune réécriture du registre n'est possible.",
      "piliers.3.title": "Vérification publique, par tous",
      "piliers.3.body":
        "N'importe quel tiers — juge, banque, confrère, assurance — peut vérifier l'authenticité d'un document depuis son téléphone en scannant le QR code du certificat. Aucun compte, aucune installation requise côté vérificateur.",
      "how.h2": "Comment ça marche",
      "how.lede": "Trois clics, dix secondes — et vous avez un certificat opposable.",
      "how.1.title": "Sélectionnez votre fichier",
      "how.1.body":
        "Glissez-déposez n'importe quel document — acte authentique, contrat, testament, conclusion, ordonnance, PV. Le format ne change rien.",
      "how.2.title": "Le hash est calculé localement",
      "how.2.body.html":
        "Votre navigateur calcule l'empreinte SHA-256 du fichier puis envoie <strong>uniquement ces 64&nbsp;caractères</strong> à notre registre. Le contenu reste sur votre machine.",
      "how.3.title": "Recevez votre certificat",
      "how.3.body.html":
        "Téléchargez immédiatement un PDF <em>Certificat de Fiducité Numérique</em> horodaté avec QR&nbsp;code de vérification. Annexable à toute procédure.",
      "bientot.h2": "Roadmap compliance — votez pour vos services prioritaires",
      "bientot.lede":
        "Nous construisons Doc-Seal avec les notaires et avocats. Indiquez les modules qui débloqueraient votre quotidien — vous recevrez une invitation prioritaire à la version bêta.",
      "bientot.s1.title": "RGPD vault",
      "bientot.s1.body":
        "Coffre-fort chiffré 5&nbsp;ans avec auto-purge à l'échéance. Conforme à l'obligation de conservation et à la limite RGPD.",
      "bientot.s2.title": "BODACC veille",
      "bientot.s2.body":
        "Alerte automatique sur les sociétés de vos dossiers. Redressements, liquidations, ventes de fonds — détectés avant la signature.",
      "bientot.s3.title": "RBE Express INPI",
      "bientot.s3.body":
        "Bénéficiaires effectifs en 30&nbsp;secondes. Chaîne de holdings reconstruite, PDF officiel formaté.",
      "bientot.s4.title": "LCB-FT scan",
      "bientot.s4.body":
        "Détection PEP automatisée avec sources ouvertes (Wikipedia structuré, sanctions UE/ONU). Niveau de risque par dossier.",
      "bientot.s5.title": "OAC dashboard",
      "bientot.s5.body":
        "Pilotage des obligations actives continues : KYC à renouveler, RBE à reconsulter, archives à purger.",
      "bientot.s6.title": "Formation Qualiopi",
      "bientot.s6.body":
        "Modules certifiants LCB-FT, RGPD, cybersécurité. Éligibles OPCO — coût réel pour le cabinet&nbsp;: zéro.",
      "bientot.vote": "Me prévenir",
      "bientot.voted": "Inscrit ✓",
      "bientot.email.placeholder": "Votre email professionnel",
      "bientot.email.submit": "Valider",
      "bientot.email.success": "Merci, vous êtes prévenu(e) en priorité.",
      "bientot.email.error": "Email invalide — réessayez.",
      "pricing.h2": "Tarifs simples, sans engagement",
      "pricing.lede": "Commencez gratuitement. Évoluez quand vos volumes l'exigent.",
      "pricing.note":
        "Tarifs indicatifs en phase de lancement. La facturation et les règles d'usage seront détaillées dans les CGU avant tout engagement.",
      "pricing.amount.0": "0",
      "pricing.amount.49": "49",
      "pricing.amount.199": "199",
      "pricing.amount.499": "499",
      "pricing.amount.1900": "1\u202F900",
      "pricing.period": "/ mois",
      "plan.discovery.title": "Découverte",
      "plan.discovery.tagline": "Pour tester Doc-Seal sur quelques dossiers.",
      "plan.discovery.f1": "10 scellements / mois",
      "plan.discovery.f2": "Vérification publique illimitée",
      "plan.discovery.f3": "Certificat PDF avec QR code",
      "plan.discovery.f4": "Support communautaire",
      "plan.discovery.cta": "Démarrer gratuitement",
      "plan.cabinet.badge": "Le plus populaire",
      "plan.cabinet.title": "Cabinet",
      "plan.cabinet.tagline": "Pour un notaire ou avocat solo.",
      "plan.cabinet.f1": "100 scellements / mois",
      "plan.cabinet.f2": "Hash-chain dédiée à votre cabinet",
      "plan.cabinet.f3": "Extension Chrome + accès API",
      "plan.cabinet.f4": "Export comptable mensuel",
      "plan.cabinet.f5": "Support email J+1",
      "plan.cabinet.cta": "Choisir Cabinet",
      "plan.pro.title": "Pro",
      "plan.pro.tagline": "Pour un cabinet de 1 à 3 professionnels.",
      "plan.pro.f1": "Scellements illimités",
      "plan.pro.f2": "RGPD vault — coffre-fort 5 ans",
      "plan.pro.f3": "BODACC veille sur vos dossiers",
      "plan.pro.f4": "RBE Express INPI",
      "plan.pro.f5": "LCB-FT scan (200 recherches / mois)",
      "plan.pro.cta": "Choisir Pro",
      "plan.etude.title": "Étude",
      "plan.etude.tagline": "Pour une étude ou un cabinet de 4 à 10 professionnels.",
      "plan.etude.f1": "Tout du plan Pro",
      "plan.etude.f2": "Jusqu'à 10 utilisateurs",
      "plan.etude.f3": "OAC dashboard",
      "plan.etude.f4": "LCB-FT scan illimité",
      "plan.etude.f5": "Ancrage on-chain (Polygon, optionnel)",
      "plan.etude.f6": "SLA 99,9 % + support téléphonique",
      "plan.etude.cta": "Choisir Étude",
      "plan.premium.badge": "Sur devis",
      "plan.premium.title": "Premium",
      "plan.premium.tagline":
        "Pour les grandes études et les cabinets internationaux (Big 4 Legal, AmLaw 100).",
      "plan.premium.f1": "Tout du plan Étude",
      "plan.premium.f2": "Onboarding sur site (Paris, Londres, Bruxelles)",
      "plan.premium.f3": "Intégration sur-mesure (iManage, NetDocuments, iNot, Genapi)",
      "plan.premium.f4": "Support dédié 24/7 (téléphone, email, Slack)",
      "plan.premium.f5": "Audit LCB-FT semestriel par notre équipe",
      "plan.premium.f6": "Multi-utilisateurs illimités, SSO SAML",
      "plan.premium.f7": "Personnalisation des certificats (logo cabinet)",
      "plan.premium.cta": "Demander un devis",
      "cta.h2.html": "Prêt à sceller votre premier document&nbsp;?",
      "cta.body":
        "Aucune carte bancaire requise. Le scellement et la vérification fonctionnent immédiatement depuis votre navigateur.",
      "cta.button": "Démarrer maintenant",
      "footer.baseline":
        "La signature cryptographique des notaires et avocats français — privacy by design.",
      "footer.app": "Application",
      "footer.fonctionnement": "Fonctionnement",
      "footer.tarifs": "Tarifs",
      "footer.contact": "Contact",
      "footer.legal.html":
        "© <span id=\"footer-year\">2026</span> Doc-Seal. Le contenu de vos fichiers n'est <strong>jamais</strong> transmis au serveur — seul le hash SHA-256 l'est. Code source ouvert."
    },
    en: {
      "html.lang": "en",
      "html.title": "Doc-Seal — Native compliance tooling for notaries and law firms",
      "html.description":
        "Doc-Seal is the native compliance toolkit for French notaries and law firms. Cryptographic sealing, GDPR, AML/CFT, beneficial ownership — all in one dashboard. Privacy by design: we never see your documents.",
      "lang.toggle.aria": "Change language",
      "lang.fr": "FR",
      "lang.en": "EN",
      "nav.fonctionnement": "How it works",
      "nav.piliers": "Why Doc-Seal",
      "nav.bientot": "Roadmap",
      "nav.tarifs": "Pricing",
      "nav.verifier": "Verify a document",
      "nav.demarrer": "Get started",
      "hero.eyebrow": "For notaries, lawyers and international law firms",
      "hero.h1.html":
        "Native compliance tooling<br />for notaries and law firms.",
      "hero.lede.html":
        "Cryptographic sealing, GDPR, AML/CFT and beneficial ownership — unified in a single dashboard. <strong>Privacy by design</strong>: the SHA-256 fingerprint is computed in your browser; the content of your documents never leaves your machine.",
      "hero.cta.primary": "Seal my first document",
      "hero.cta.secondary": "Verify a received document",
      "hero.trust.1": "SHA-256 computed in the browser",
      "hero.trust.2": "Append-only hash-chain",
      "hero.trust.3": "Optional on-chain anchoring",
      "hero.card.title": "Digital Trust Certificate",
      "hero.card.fingerprint": "SHA-256 fingerprint",
      "hero.card.sealed": "Sealed on",
      "hero.card.sealed.value": "April 25, 2026 — 14:32 UTC",
      "hero.card.chain": "Chain index",
      "hero.card.status": "Status",
      "hero.card.status.value": "✓ Authentic",
      "hero.card.scan": "Scan to verify",
      "piliers.h2.html": "Three principles, one guarantee: integrity.",
      "piliers.1.title": "Zero-knowledge by default",
      "piliers.1.body.html":
        "Your file content never leaves your device. Only the 64-character SHA-256 fingerprint is transmitted. <strong>Professional secrecy is preserved by construction, not by contractual promise.</strong>",
      "piliers.2.title": "Indisputable timestamping",
      "piliers.2.body.html":
        "Every seal is recorded in an <em>append-only</em> hash-chain. A single byte modified in the original document produces a different fingerprint and <strong>automatically invalidates the certificate</strong>. The registry cannot be rewritten.",
      "piliers.3.title": "Public verification, by anyone",
      "piliers.3.body":
        "Any third party — judge, bank, fellow professional, insurer — can verify a document's authenticity from their phone by scanning the certificate's QR code. No account, no installation required for the verifier.",
      "how.h2": "How it works",
      "how.lede": "Three clicks, ten seconds — and you hold a court-admissible certificate.",
      "how.1.title": "Pick your file",
      "how.1.body":
        "Drag and drop any document — notarial deed, contract, will, pleading, prescription, minutes. The format is irrelevant.",
      "how.2.title": "The hash is computed locally",
      "how.2.body.html":
        "Your browser computes the file's SHA-256 fingerprint, then sends <strong>only those 64 characters</strong> to our registry. The content stays on your machine.",
      "how.3.title": "Receive your certificate",
      "how.3.body.html":
        "Instantly download a timestamped <em>Digital Trust Certificate</em> PDF with a verification QR code. Attachable to any proceeding.",
      "bientot.h2": "Compliance roadmap — vote for your priorities",
      "bientot.lede":
        "We build Doc-Seal with notaries and lawyers. Tell us which modules would unlock your day-to-day — you'll get priority access to the beta.",
      "bientot.s1.title": "GDPR vault",
      "bientot.s1.body":
        "Encrypted 5-year vault with automatic purge on expiry. Compliant with retention obligations and the GDPR limit.",
      "bientot.s2.title": "BODACC monitoring",
      "bientot.s2.body":
        "Automatic alerts on the companies in your case files. Receiverships, liquidations, business sales — flagged before signing.",
      "bientot.s3.title": "Express INPI beneficial ownership",
      "bientot.s3.body":
        "Beneficial owners in 30 seconds. Holding chain rebuilt, official PDF formatted.",
      "bientot.s4.title": "AML/CFT scan",
      "bientot.s4.body":
        "Automated PEP detection across open sources (structured Wikipedia, EU/UN sanctions). Per-file risk score.",
      "bientot.s5.title": "Active obligations dashboard",
      "bientot.s5.body":
        "Steer your continuous obligations: KYC to renew, beneficial ownership to refresh, archives to purge.",
      "bientot.s6.title": "Qualiopi-certified training",
      "bientot.s6.body":
        "Certifying modules in AML/CFT, GDPR, cybersecurity. OPCO-eligible — net cost to the firm: zero.",
      "bientot.vote": "Notify me",
      "bientot.voted": "Subscribed ✓",
      "bientot.email.placeholder": "Your work email",
      "bientot.email.submit": "Submit",
      "bientot.email.success": "Thank you, you're on the priority list.",
      "bientot.email.error": "Invalid email — please try again.",
      "pricing.h2": "Simple pricing, no commitment",
      "pricing.lede": "Start free. Scale up when your volume requires it.",
      "pricing.note":
        "Indicative pricing during launch phase. Billing and usage rules will be detailed in the Terms of Service before any commitment.",
      "pricing.amount.0": "0",
      "pricing.amount.49": "49",
      "pricing.amount.199": "199",
      "pricing.amount.499": "499",
      "pricing.amount.1900": "1,900",
      "pricing.period": "/ month",
      "plan.discovery.title": "Discovery",
      "plan.discovery.tagline": "To try Doc-Seal on a few files.",
      "plan.discovery.f1": "10 seals / month",
      "plan.discovery.f2": "Unlimited public verification",
      "plan.discovery.f3": "PDF certificate with QR code",
      "plan.discovery.f4": "Community support",
      "plan.discovery.cta": "Start for free",
      "plan.cabinet.badge": "Most popular",
      "plan.cabinet.title": "Cabinet",
      "plan.cabinet.tagline": "For a solo notary or lawyer.",
      "plan.cabinet.f1": "100 seals / month",
      "plan.cabinet.f2": "Dedicated hash-chain for your firm",
      "plan.cabinet.f3": "Chrome extension + API access",
      "plan.cabinet.f4": "Monthly accounting export",
      "plan.cabinet.f5": "Email support, next-business-day",
      "plan.cabinet.cta": "Choose Cabinet",
      "plan.pro.title": "Pro",
      "plan.pro.tagline": "For a 1 to 3-professional firm.",
      "plan.pro.f1": "Unlimited seals",
      "plan.pro.f2": "GDPR vault — 5-year retention",
      "plan.pro.f3": "BODACC monitoring on your files",
      "plan.pro.f4": "Express INPI beneficial ownership",
      "plan.pro.f5": "AML/CFT scan (200 lookups / month)",
      "plan.pro.cta": "Choose Pro",
      "plan.etude.title": "Étude",
      "plan.etude.tagline": "For a 4 to 10-professional firm.",
      "plan.etude.f1": "Everything in Pro",
      "plan.etude.f2": "Up to 10 users",
      "plan.etude.f3": "Active obligations dashboard",
      "plan.etude.f4": "Unlimited AML/CFT scan",
      "plan.etude.f5": "On-chain anchoring (Polygon, optional)",
      "plan.etude.f6": "99.9% SLA + phone support",
      "plan.etude.cta": "Choose Étude",
      "plan.premium.badge": "On request",
      "plan.premium.title": "Premium",
      "plan.premium.tagline":
        "For large firms and international practices (Big 4 Legal, AmLaw 100).",
      "plan.premium.f1": "Everything in Étude",
      "plan.premium.f2": "On-site onboarding (Paris, London, Brussels)",
      "plan.premium.f3":
        "Custom integration (iManage, NetDocuments, iNot, Genapi)",
      "plan.premium.f4": "Dedicated 24/7 support (phone, email, Slack)",
      "plan.premium.f5": "Bi-annual AML/CFT audit by our team",
      "plan.premium.f6": "Unlimited users, SAML SSO",
      "plan.premium.f7": "Branded certificates (firm logo)",
      "plan.premium.cta": "Request a quote",
      "cta.h2.html": "Ready to seal your first document?",
      "cta.body":
        "No credit card required. Sealing and verification work immediately from your browser.",
      "cta.button": "Get started now",
      "footer.baseline":
        "The cryptographic signature for French notaries and lawyers — privacy by design.",
      "footer.app": "Application",
      "footer.fonctionnement": "How it works",
      "footer.tarifs": "Pricing",
      "footer.contact": "Contact",
      "footer.legal.html":
        "© <span id=\"footer-year\">2026</span> Doc-Seal. Your file content is <strong>never</strong> sent to the server — only the SHA-256 hash. Open source."
    }
  };

  function detectInitialLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && TRANSLATIONS[stored]) return stored;
    } catch (e) {
      /* ignore */
    }
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    if (nav.indexOf("en") === 0) return "en";
    return DEFAULT_LANG;
  }

  function getString(lang, key) {
    var dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    var fallback = TRANSLATIONS[DEFAULT_LANG];
    if (Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
    return key;
  }

  function applyTranslations(lang) {
    document.documentElement.lang = getString(lang, "html.lang");

    var titleStr = getString(lang, "html.title");
    if (titleStr) document.title = titleStr;

    var descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute("content", getString(lang, "html.description"));

    // Plain text nodes (data-i18n)
    var textNodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < textNodes.length; i++) {
      var node = textNodes[i];
      node.textContent = getString(lang, node.getAttribute("data-i18n"));
    }

    // HTML nodes (data-i18n-html) — translations contain trusted HTML.
    var htmlNodes = document.querySelectorAll("[data-i18n-html]");
    for (var j = 0; j < htmlNodes.length; j++) {
      var hnode = htmlNodes[j];
      hnode.innerHTML = getString(lang, hnode.getAttribute("data-i18n-html"));
    }

    // Attribute translations (data-i18n-attr="attr:key,attr2:key2")
    var attrNodes = document.querySelectorAll("[data-i18n-attr]");
    for (var k = 0; k < attrNodes.length; k++) {
      var anode = attrNodes[k];
      var spec = anode.getAttribute("data-i18n-attr");
      var pairs = spec.split(",");
      for (var p = 0; p < pairs.length; p++) {
        var parts = pairs[p].split(":");
        if (parts.length === 2) {
          anode.setAttribute(parts[0].trim(), getString(lang, parts[1].trim()));
        }
      }
    }

    // Footer year always current.
    var footerYear = document.getElementById("footer-year");
    if (footerYear) footerYear.textContent = String(new Date().getFullYear());

    // Toggle button visual state.
    var btns = document.querySelectorAll(".lang-btn");
    for (var b = 0; b < btns.length; b++) {
      var bl = btns[b].getAttribute("data-lang");
      btns[b].setAttribute("aria-pressed", bl === lang ? "true" : "false");
      btns[b].classList.toggle("is-active", bl === lang);
    }
  }

  function setLang(lang) {
    if (!TRANSLATIONS[lang]) lang = DEFAULT_LANG;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    applyTranslations(lang);
  }

  function init() {
    var initial = detectInitialLang();
    applyTranslations(initial);

    var btns = document.querySelectorAll(".lang-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function (ev) {
        ev.preventDefault();
        setLang(this.getAttribute("data-lang"));
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose minimal API for debugging.
  window.DocSealI18n = { setLang: setLang, getLang: detectInitialLang };
})();
