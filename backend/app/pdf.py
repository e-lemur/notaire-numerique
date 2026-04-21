"""Génération du PDF « Certificat de Fiducité Numérique »."""

from __future__ import annotations

import io

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .models import Seal


def render_certificate(seal: Seal, owner_email: str) -> bytes:
    """Retourne un PDF (bytes) récapitulant le scellement."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    styles = getSampleStyleSheet()
    _ = styles  # placeholder — si on veut passer en Platypus plus tard

    # En-tête
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, height - 30 * mm, "Certificat de Fiducité Numérique")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 38 * mm, "Notaire Numérique Inviolable — MVP v0")

    c.line(20 * mm, height - 42 * mm, width - 20 * mm, height - 42 * mm)

    # Corps
    y = height - 55 * mm
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
        # Retour à la ligne simple pour les hashes (64 caractères)
        if len(value) > 80:
            c.drawString(70 * mm, y, value[:80])
            y -= 5 * mm
            c.drawString(70 * mm, y, value[80:])
        else:
            c.drawString(70 * mm, y, value)
        y -= 6 * mm

    # Mention légale
    y -= 10 * mm
    c.setFont("Helvetica-Oblique", 8)
    mentions = [
        "Ce certificat atteste cryptographiquement qu'un document dont l'empreinte SHA-256 figure",
        "ci-dessus a été enregistré dans le registre append-only du Notaire Numérique à la date",
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
