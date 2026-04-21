// Page publique de vérification.
// Calcule localement le SHA-256 d'un fichier déposé puis interroge /verify.

const $ = (id) => document.getElementById(id);

function apiUrl() {
  return $("api-url").value.trim().replace(/\/$/, "");
}

async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyHash(hash) {
  const resp = await fetch(`${apiUrl()}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_hash: hash }),
  });
  if (!resp.ok) {
    throw new Error(`Erreur serveur (${resp.status}) : ${await resp.text()}`);
  }
  return await resp.json();
}

function renderResult(hash, data) {
  const box = $("result");
  const title = $("result-title");
  const sub = $("result-sub");
  const details = $("result-details");
  details.innerHTML = "";
  box.hidden = false;
  if (data.exists) {
    box.className = "ok";
    title.textContent = "✓ Document scellé et authentique";
    sub.textContent = data.chain_valid
      ? "L'empreinte a été retrouvée dans le registre. L'intégrité de la chaîne a été vérifiée."
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
    box.className = "ko";
    title.textContent = "✗ Aucun scellement trouvé";
    sub.textContent =
      "Ce document n'a pas été scellé dans ce registre, ou il a été modifié depuis son scellement.";
    const dt = document.createElement("dt");
    dt.textContent = "Empreinte recalculée";
    const dd = document.createElement("dd");
    dd.textContent = hash;
    details.append(dt, dd);
  }
}

async function handleFile(file) {
  try {
    renderPending();
    const hash = await sha256Hex(file);
    const data = await verifyHash(hash);
    renderResult(hash, data);
  } catch (err) {
    renderError(err.message);
  }
}

function renderPending() {
  const box = $("result");
  box.hidden = false;
  box.className = "";
  $("result-title").textContent = "Vérification en cours...";
  $("result-sub").textContent = "";
  $("result-details").innerHTML = "";
}

function renderError(msg) {
  const box = $("result");
  box.hidden = false;
  box.className = "ko";
  $("result-title").textContent = "Erreur";
  $("result-sub").textContent = msg;
  $("result-details").innerHTML = "";
}

// ----- Events -----
const dz = $("dropzone");
dz.addEventListener("dragover", (e) => {
  e.preventDefault();
  dz.classList.add("dragover");
});
dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
dz.addEventListener("drop", (e) => {
  e.preventDefault();
  dz.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});
$("file-input").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
});

$("btn-verify-hash").addEventListener("click", async () => {
  const h = $("hash-input").value.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) {
    renderError("Hash invalide (attendu : 64 caractères hexadécimaux).");
    return;
  }
  try {
    renderPending();
    const data = await verifyHash(h);
    renderResult(h, data);
  } catch (err) {
    renderError(err.message);
  }
});
