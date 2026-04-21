// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Notary — ancrage public de hashes de documents
/// @notice Contrat minimal qui écrit pour chaque hash l'instant du scellement.
///         La valeur de `block.timestamp` fait foi — une fois minée, la
///         transaction ne peut être ni supprimée ni antidatée.
contract Notary {
    /// @dev documentHash => timestamp du premier scellement (0 = non scellé).
    mapping(bytes32 => uint256) private _sealedAt;

    /// @notice sceller un hash. Si déjà scellé, l'appel n'a pas d'effet
    ///         (pour garantir l'unicité de l'horodatage).
    event Sealed(bytes32 indexed documentHash, address indexed by, uint256 at);

    function seal(bytes32 documentHash) external {
        if (_sealedAt[documentHash] == 0) {
            _sealedAt[documentHash] = block.timestamp;
            emit Sealed(documentHash, msg.sender, block.timestamp);
        }
    }

    /// @notice retourne l'horodatage du scellement (0 si absent).
    function sealedAt(bytes32 documentHash) external view returns (uint256) {
        return _sealedAt[documentHash];
    }

    /// @notice vrai si le hash a été scellé au moins une fois.
    function isSealed(bytes32 documentHash) external view returns (bool) {
        return _sealedAt[documentHash] != 0;
    }
}
