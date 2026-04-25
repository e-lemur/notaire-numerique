"""Génération du PDF « Certificat de Fiducité Numérique »."""

from __future__ import annotations

import io

import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .config import settings
from .models import Seal


def _build_verify_url(document_hash: str) -> str:
    template = settings.verify_base_url
    if "{hash}" in template:
        return template.replace("{hash}", document_hash)
    # rétro-compatibilité si l'utilisateur a juste configuré le domaine
    sep = "&" if "?" in template else "?"
    return f"{template.rstrip('/')}{sep}hash={document_hash}"


def _make_qr_png(payload: str) -> bytes:
    """Produit un PNG contenant un QR code pour ``payload``."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def render_certificate(seal: Seal, owner_email: str) -> bytes:
    """Retourne un PDF (bytes) récapitulant le scellement.

    Le PDF inclut un QR code en haut à droite qui pointe vers la page publique
    de vérification (hash pré-rempli) — un juge ou un tiers peut donc vérifier
    l'authenticité en scannant simplement le PDF depuis son téléphone.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    verify_url = _build_verify_url(seal.document_hash)
    qr_png = _make_qr_png(verify_url)

    # QR code en haut à droite (30 mm × 30 mm)
    qr_size = 30 * mm
    qr_x = width - 20 * mm - qr_size
    qr_y = height - 20 * mm - qr_size
    c.drawImage(
        ImageReader(io.BytesIO(qr_png)),
        qr_x,
        qr_y,
        width=qr_size,
        height=qr_size,
        preserveAspectRatio=True,
        mask="auto",
    )
    c.setFont("Helvetica", 7)
    c.drawCentredString(
        qr_x + qr_size / 2,
        qr_y - 3 * mm,
        "Scannez pour vérifier",
    )

    # En-tête
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, height - 30 * mm, "Certificat de Fiducité Numérique")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 38 * mm, "Trust-Seal — trust-seal.xyz")

    c.line(20 * mm, height - 55 * mm, width - 20 * mm, height - 55 * mm)

    # Corps
    y = height - 68 * mm
    rows = [
        ("Identifiant de scellement", str(seal.id)),
        ("Empreinte (SHA-256)", seal.document_hash),
        ("Type de document", seal.document_type.value),
        ("Libellé", seal.label or "—"),
        ("Scellé le", seal.sealed_at.isoformat() + " UTC"),
        ("Propriétaire", owner_email),
        ("Index de chaîne", str(seal.chain_index)),
        ("Hash précédent", seal.previous_chain_hash),
        ("Hash de chaîne", seal.chain_hash),
        ("Transaction on-chain", seal.onchain_tx_hash or "— (hash-chain interne uniquement)"),
        ("Bloc on-chain", str(seal.onchain_block_number) if seal.onchain_block_number else "—"),
    ]
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Détails du scellement")
    y -= 8 * mm
    c.setFont("Helvetica", 9)
    for label, value in rows:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(20 * mm, y, f"{label} :")
        c.setFont("Helvetica", 9)
        if len(value) > 80:
            c.drawString(70 * mm, y, value[:80])
            y -= 5 * mm
            c.drawString(70 * mm, y, value[80:])
        else:
            c.drawString(70 * mm, y, value)
        y -= 6 * mm

    # URL de vérification (en clair sous le QR) + éventuel lien on-chain
    y -= 4 * mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(20 * mm, y, "URL de vérification :")
    c.setFont("Helvetica", 8)
    y -= 5 * mm
    c.drawString(20 * mm, y, verify_url)
    if seal.onchain_tx_hash and settings.onchain_explorer_tx_url:
        y -= 6 * mm
        c.setFont("Helvetica-Bold", 9)
        c.drawString(20 * mm, y, "Transaction on-chain :")
        c.setFont("Helvetica", 8)
        y -= 5 * mm
        tx_url = settings.onchain_explorer_tx_url.replace("{tx}", seal.onchain_tx_hash)
        c.drawString(20 * mm, y, tx_url)

    # Mention légale
    y -= 10 * mm
    c.setFont("Helvetica-Oblique", 8)
    mentions = [
        "Ce certificat atteste cryptographiquement qu'un document dont l'empreinte SHA-256 figure",
        "ci-dessus a été enregistré dans le registre append-only Trust-Seal à la date",
        "indiquée. Toute modification d'un seul octet du document original produit une empreinte",
        "différente et rend ce certificat invalide. Le contenu du document n'a jamais été transmis",
        "au serveur, ce qui préserve le secret professionnel (avocat, notaire, médical).",
    ]
    for line in mentions:
        c.drawString(20 * mm, y, line)
        y -= 4 * mm

    c.showPage()
    c.save()
    return buf.getvalue()
