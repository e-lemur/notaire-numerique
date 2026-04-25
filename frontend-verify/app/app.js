// Trust-Seal — web app publique.
// Deux modes : public (vérification anonyme), authentifié (scellement + liste).

const $ = (id) => document.getElementById(id);
const SESSION_KEY = "trust_seal_session_v1";
// Récupère l'éventuelle ancienne session pour migrer en douceur.
(() => {
  if (!localStorage.getItem(SESSION_KEY)) {
    const legacy = localStorage.getItem("notaire_session_v2");
    if (legacy) {
      localStorage.setItem(SESSION_KEY, legacy);
      localStorage.removeItem("notaire_session_v2");
    }
  }
})();

// ---------- Config ----------
function apiUrl() {
  const stored = $("api-url").value.trim().replace(/\/$/, "");
  if (stored) return stored;
  const configured = window.__TRUST_SEAL_API_URL__ || window.__NOTAIRE_API_URL__;
  return (configured || "http://localhost:8000").replace(/\/$/, "");
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ---------- Utils ----------
async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function setStatus(elId, msg, kind) {
  const el = $(elId);
  el.textContent = msg;
  el.className = `status ${kind || ""}`;
}

// ---------- API ----------
async function apiRegister(email, password, role) {
  const r = await fetch(`${apiUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  if (!r.ok) throw new Error(`Inscription refusée (${r.status}) : ${await r.text()}`);
  return await r.json();
}
async function apiLogin(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const r = await fetch(`${apiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Connexion refusée (${r.status}) : ${await r.text()}`);
  return (await r.json()).access_token;
}
async function apiSeal(token, payload) {
  const r = await fetch(`${apiUrl()}/seal`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Scellement refusé (${r.status}) : ${await r.text()}`);
  return await r.json();
}
async function apiVerify(hash) {
  const r = await fetch(`${apiUrl()}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_hash: hash }),
  });
  if (!r.ok) throw new Error(`Erreur serveur (${r.status})`);
  return await r.json();
}
async function apiListSeals(token) {
  const r = await fetch(`${apiUrl()}/seals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Erreur (${r.status})`);
  return await r.json();
}

// ---------- UI : navigation ----------
function activateTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${name}`));
  if (name === "list") refreshSealsList();
}
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => activateTab(t.dataset.tab))
);

// ---------- Vérification ----------
function renderPending() {
  const box = $("result");
  box.hidden = false;
  box.className = "result";
  $("result-title").textContent = "Vérification en cours...";
  $("result-sub").textContent = "";
  $("result-details").innerHTML = "";
}
function renderError(msg) {
  const box = $("result");
  box.hidden = false;
  box.className = "result ko";
  $("result-title").textContent = "Erreur";
  $("result-sub").textContent = msg;
  $("result-details").innerHTML = "";
}
function renderResult(hash, data) {
  const box = $("result");
  const title = $("result-title");
  const sub = $("result-sub");
  const details = $("result-details");
  details.innerHTML = "";
  box.hidden = false;
  if (data.exists) {
    box.className = "result ok";
    title.textContent = "✓ Document scellé et authentique";
    sub.textContent = data.chain_valid
      ? "L'empreinte a été retrouvée dans le registre. L'intégrité de la chaîne est vérifiée."
      : "⚠ L'empreinte est présente mais la chaîne présente une anomalie globale — contactez l'administrateur.";
    const rows = [
      ["Empreinte vérifiée", hash],
      ["ID de scellement", data.seal.seal_id],
      ["Type de document", data.seal.document_type],
      ["Scellé le", new Date(data.seal.sealed_at).toLocaleString("fr-FR") + " UTC"],
      ["Index de chaîne", data.seal.chain_index],
      ["Hash précédent", data.seal.previous_chain_hash],
      ["Hash de chaîne", data.seal.chain_hash],
      ["Transaction on-chain", data.seal.onchain_tx_hash || "— (hash-chain interne uniquement)"],
      ["Bloc on-chain", data.seal.onchain_block_number ?? "—"],
    ];
    for (const [k, v] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = k;
      const dd = document.createElement("dd");
      dd.textContent = v;
      details.append(dt, dd);
    }
  } else {
    box.className = "result ko";
    title.textContent = "✗ Aucun scellement trouvé";
    sub.textContent = "Ce document n'a pas été scellé dans ce registre, ou il a été modifié depuis son scellement.";
    const dt = document.createElement("dt");
    dt.textContent = "Empreinte recalculée";
    const dd = document.createElement("dd");
    dd.textContent = hash;
    details.append(dt, dd);
  }
}

async function handleFileVerify(file) {
  try {
    activateTab("verify");
    renderPending();
    const hash = await sha256Hex(file);
    const data = await apiVerify(hash);
    renderResult(hash, data);
  } catch (err) { renderError(err.message); }
}
async function verifyHashAndRender(h) {
  const hh = h.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hh)) { renderError("Hash invalide (64 caractères hex attendus)."); return; }
  try {
    activateTab("verify");
    renderPending();
    const data = await apiVerify(hh);
    renderResult(hh, data);
  } catch (err) { renderError(err.message); }
}

const dz = $("dropzone");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFileVerify(file);
});
$("file-input-verify").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleFileVerify(file);
});
$("btn-verify-hash").addEventListener("click", () => verifyHashAndRender($("hash-input").value));

// ---------- Inscription / Login / Logout ----------
function refreshAuthUI() {
  const s = loadSession();
  if (s) {
    $("auth-box").hidden = true;
    $("seal-box").hidden = false;
    $("session-email").hidden = false;
    $("session-email").textContent = s.email;
    $("btn-logout").hidden = false;
    document.querySelector('.tab[data-tab="list"]').hidden = false;
  } else {
    $("auth-box").hidden = false;
    $("seal-box").hidden = true;
    $("session-email").hidden = true;
    $("btn-logout").hidden = true;
    document.querySelector('.tab[data-tab="list"]').hidden = true;
  }
}

$("btn-register").addEventListener("click", async () => {
  const email = $("reg-email").value.trim();
  const password = $("reg-password").value;
  const role = $("reg-role").value;
  if (!email || password.length < 8) {
    setStatus("reg-status", "Email + mot de passe ≥ 8 caractères requis.", "err");
    return;
  }
  setStatus("reg-status", "Création du compte...");
  try {
    await apiRegister(email, password, role);
    const token = await apiLogin(email, password);
    saveSession({ email, token });
    setStatus("reg-status", "Compte créé, vous êtes connecté.", "ok");
    refreshAuthUI();
  } catch (err) { setStatus("reg-status", err.message, "err"); }
});

$("btn-login").addEventListener("click", async () => {
  const email = $("login-email").value.trim();
  const password = $("login-password").value;
  if (!email || !password) { setStatus("login-status", "Email + mot de passe requis.", "err"); return; }
  setStatus("login-status", "Connexion en cours...");
  try {
    const token = await apiLogin(email, password);
    saveSession({ email, token });
    setStatus("login-status", "Connecté.", "ok");
    refreshAuthUI();
  } catch (err) { setStatus("login-status", err.message, "err"); }
});

$("btn-logout").addEventListener("click", () => {
  clearSession();
  refreshAuthUI();
  activateTab("verify");
});

// ---------- Scellement ----------
$("file-input-seal").addEventListener("change", () => {
  $("btn-seal").disabled = !$("file-input-seal").files?.length;
  $("hash-preview").textContent = "";
  $("receipt").hidden = true;
});

$("btn-seal").addEventListener("click", async () => {
  const file = $("file-input-seal").files?.[0];
  if (!file) return;
  const session = loadSession();
  if (!session) { refreshAuthUI(); return; }
  setStatus("seal-status", "Calcul local de l'empreinte SHA-256...");
  try {
    const hash = await sha256Hex(file);
    $("hash-preview").textContent = `Fichier : ${file.name}\nTaille : ${file.size} octets\nSHA-256 : ${hash}`;
    setStatus("seal-status", "Envoi au registre...");
    const resp = await apiSeal(session.token, {
      document_hash: hash,
      document_type: $("seal-type").value,
      label: $("seal-label").value.trim() || null,
    });
    $("r-id").textContent = resp.seal_id;
    $("r-hash").textContent = resp.document_hash;
    $("r-time").textContent = new Date(resp.sealed_at).toLocaleString("fr-FR") + " UTC";
    $("r-index").textContent = resp.chain_index;
    $("r-chain").textContent = resp.chain_hash;
    $("r-tx").textContent = resp.onchain_tx_hash || "— (hash-chain interne uniquement)";
    $("pdf-link").href = `${apiUrl()}/certificate/${resp.seal_id}`;
    // téléchargement via fetch authentifié : on ajoute token en query fallback via blob
    $("pdf-link").onclick = async (e) => {
      e.preventDefault();
      const r = await fetch(`${apiUrl()}/certificate/${resp.seal_id}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!r.ok) return alert("Téléchargement échoué");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    };
    $("receipt").hidden = false;
    setStatus("seal-status", "Document scellé.", "ok");
  } catch (err) { setStatus("seal-status", err.message, "err"); }
});

// ---------- Mes scellements ----------
async function refreshSealsList() {
  const session = loadSession();
  if (!session) return;
  const box = $("seals-list");
  box.textContent = "Chargement...";
  try {
    const seals = await apiListSeals(session.token);
    if (!seals.length) { box.innerHTML = "<p class='help'>Aucun scellement pour le moment.</p>"; return; }
    box.innerHTML = "";
    for (const s of seals) {
      const card = document.createElement("div");
      card.className = "seal-card";
      card.innerHTML = `
        <div class="row">
          <div><strong>${s.label || "(sans libellé)"}</strong> — ${s.document_type}</div>
          <div>#${s.chain_index} — ${new Date(s.sealed_at).toLocaleString("fr-FR")}</div>
        </div>
        <div class="meta">SHA-256 : ${s.document_hash}</div>
        <div class="meta">Chain hash : ${s.chain_hash}</div>
      `;
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "Télécharger le certificat PDF";
      link.onclick = async (e) => {
        e.preventDefault();
        const r = await fetch(`${apiUrl()}/certificate/${s.seal_id}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        if (!r.ok) return alert("Téléchargement échoué");
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      };
      card.appendChild(link);
      box.appendChild(card);
    }
  } catch (err) {
    box.innerHTML = `<p class='status err'>${err.message}</p>`;
  }
}
$("btn-refresh-list").addEventListener("click", refreshSealsList);

// ---------- Init ----------
function init() {
  $("api-url").value = window.__NOTAIRE_API_URL__ || "http://localhost:8000";
  refreshAuthUI();
  const params = new URLSearchParams(window.location.search);
  const h = params.get("hash");
  if (h) { $("hash-input").value = h; verifyHashAndRender(h); }
}
init();
