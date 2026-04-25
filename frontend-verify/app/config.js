// URL de l'API publique. Surchargée à la build avant le déploiement
// (cf. docs/USAGE.md). En dev local : http://localhost:8000.
window.__TRUST_SEAL_API_URL__ = "https://api.trust-seal.xyz";
// Rétro-compatibilité avec l'ancien nom de variable
window.__NOTAIRE_API_URL__ = window.__TRUST_SEAL_API_URL__;
