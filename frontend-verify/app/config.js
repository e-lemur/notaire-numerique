// URL de l'API publique. Surchargée à la build avant le déploiement
// (cf. docs/USAGE.md). En dev local : http://localhost:8000.
window.__DOC_SEAL_API_URL__ = "https://api.doc-seal.com";
// Rétro-compatibilité avec les anciens noms de variables (Trust-Seal, Notaire Numérique)
window.__TRUST_SEAL_API_URL__ = window.__DOC_SEAL_API_URL__;
window.__NOTAIRE_API_URL__ = window.__DOC_SEAL_API_URL__;
