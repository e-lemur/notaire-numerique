"""Ancrage optionnel sur une blockchain EVM externe (Ethereum / Polygon).

Si ``WEB3_RPC_URL`` et ``NOTARY_CONTRACT_ADDRESS`` sont configurés, le backend
envoie aussi chaque hash au contrat ``Notary.sol`` déployé, pour bénéficier
de la force probante d'un registre public. Sinon, seule la hash-chain
interne est utilisée (c'est déjà tamper-evident pour le MVP).
"""

from __future__ import annotations

import logging

from .config import settings

log = logging.getLogger(__name__)

# ABI minimal — doit correspondre à ``contracts/contracts/Notary.sol``.
NOTARY_ABI: list[dict] = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"},
        ],
        "name": "seal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"},
        ],
        "name": "sealedAt",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
]


class OnChainAnchor:
    """Enveloppe fine autour de web3.py pour ancrer un hash on-chain."""

    def __init__(self) -> None:
        self.enabled = bool(
            settings.web3_rpc_url
            and settings.notary_contract_address
            and settings.web3_private_key
        )
        if not self.enabled:
            log.info("Ancrage on-chain désactivé (variables d'environnement manquantes)")
            return
        from web3 import Web3

        self._w3 = Web3(Web3.HTTPProvider(settings.web3_rpc_url))
        self._account = self._w3.eth.account.from_key(settings.web3_private_key)
        self._contract = self._w3.eth.contract(
            address=self._w3.to_checksum_address(settings.notary_contract_address or ""),
            abi=NOTARY_ABI,
        )

    def seal(self, document_hash_hex: str) -> tuple[str | None, int | None]:
        """Envoie le hash au contrat et renvoie ``(tx_hash, block_number)``.

        Retourne ``(None, None)`` si l'ancrage est désactivé ou échoue. La
        hash-chain interne reste source de vérité en cas d'échec réseau.
        """
        if not self.enabled:
            return None, None
        try:
            hash_bytes = bytes.fromhex(document_hash_hex)
            if len(hash_bytes) != 32:
                raise ValueError("document_hash doit faire 32 octets")
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._contract.functions.seal(hash_bytes).build_transaction(
                {
                    "from": self._account.address,
                    "nonce": nonce,
                    "gas": 200_000,
                    "gasPrice": self._w3.eth.gas_price,
                }
            )
            signed = self._account.sign_transaction(tx)
            tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            return tx_hash.hex(), int(receipt["blockNumber"])
        except Exception as exc:  # noqa: BLE001 — on ne doit jamais casser le scellement
            log.warning("Ancrage on-chain échoué, seule la hash-chain interne sera utilisée: %s", exc)
            return None, None


anchor = OnChainAnchor()
