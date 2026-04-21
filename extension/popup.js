// Popup de l'extension : login, hash local, scellement.
// Aucun contenu de fichier n'est envoyé au serveur — seul le hash SHA-256
// (calculé localement via SubtleCrypto) transite.

const $ = (id) => document.getElementById(id);

const SESSION_KEY = "notaire_session_v1";

// ----- Stockage session -----
async function loadSession() {
  const got = await chrome.storage.local.get(SESSION_KEY);
  return got[SESSION_KEY] || null;
}
async function saveSession(s) {
  await chrome.storage.local.set({ [SESSION_KEY]: s });
}
async function clearSession() {
  await chrome.storage.local.remove(SESSION_KEY);
}

// ----- Hash local -----
async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ----- API -----
async function apiLogin(apiUrl, email, password) {
  const body = new URLSearchParams({ username: email, password });
  const resp = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Login échoué (${resp.status}) : ${text}`);
  }
  return (await resp.json()).access_token;
}

async function apiSeal(apiUrl, token, payload) {
  const resp = await fetch(`${apiUrl}/seal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Scellement échoué (${resp.status}) : ${text}`);
  }
  return await resp.json();
}

// ----- UI -----
function setStatus(elId, msg, kind) {
  const el = $(elId);
  el.textContent = msg;
  el.className = `status ${kind || ""}`;
}

function showSealView() {
  $("auth-section").hidden = true;
  $("seal-section").hidden = false;
}
function showLoginView() {
  $("auth-section").hidden = false;
  $("seal-section").hidden = true;
  $("receipt").hidden = true;
  $("hash-preview").textContent = "";
}

async function init() {
  const session = await loadSession();
  if (session) {
    $("api-url").value = session.apiUrl;
    showSealView();
  }
}

$("btn-login").addEventListener("click", async () => {
  const apiUrl = $("api-url").value.trim().replace(/\/$/, "");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!apiUrl || !email || !password) {
    setStatus("auth-status", "Remplissez tous les champs.", "err");
    return;
  }
  setStatus("auth-status", "Connexion en cours...");
  try {
    const token = await apiLogin(apiUrl, email, password);
    await saveSession({ apiUrl, token, email });
    setStatus("auth-status", "Connecté.", "ok");
    showSealView();
  } catch (err) {
    setStatus("auth-status", err.message, "err");
  }
});

$("btn-logout").addEventListener("click", async () => {
  await clearSession();
  showLoginView();
});

$("file-input").addEventListener("change", () => {
  $("btn-seal").disabled = !$("file-input").files?.length;
  $("hash-preview").textContent = "";
  $("receipt").hidden = true;
});

$("btn-seal").addEventListener("click", async () => {
  const file = $("file-input").files?.[0];
  if (!file) return;
  const session = await loadSession();
  if (!session) {
    showLoginView();
    return;
  }
  setStatus("seal-status", "Calcul de l'empreinte SHA-256 (local)...");
  try {
    const hash = await sha256Hex(file);
    $("hash-preview").textContent =
      `Fichier : ${file.name}\nTaille : ${file.size} octets\nSHA-256 : ${hash}`;
    setStatus("seal-status", "Envoi au registre...");
    const resp = await apiSeal(session.apiUrl, session.token, {
      document_hash: hash,
      document_type: $("doc-type").value,
      label: $("label").value.trim() || null,
    });
    $("r-id").textContent = resp.seal_id;
    $("r-hash").textContent = resp.document_hash;
    $("r-time").textContent = resp.sealed_at;
    $("r-index").textContent = resp.chain_index;
    $("r-chain").textContent = resp.chain_hash;
    $("r-tx").textContent = resp.onchain_tx_hash || "— (hash-chain interne uniquement)";
    $("pdf-link").href = `${session.apiUrl}/certificate/${resp.seal_id}`;
    $("receipt").hidden = false;
    setStatus("seal-status", "Document scellé avec succès.", "ok");
  } catch (err) {
    setStatus("seal-status", err.message, "err");
  }
});

init();
