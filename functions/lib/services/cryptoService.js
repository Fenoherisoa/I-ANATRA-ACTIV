"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Service Cryptographique (Ed25519 + HMAC-SHA256 + KeyGen)
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const keyGenerator_1 = require("../crypto/keyGenerator");
const keyHasher_1 = require("../crypto/keyHasher");
const ed25519Signer_1 = require("../crypto/ed25519Signer");
const firebase_1 = require("../config/firebase");
class CryptoService {
    signer;
    secretPepper;
    constructor(privateKeyBase64, pepper) {
        const config = (0, firebase_1.getLicensingConfig)();
        this.secretPepper = pepper || config.secretPepper;
        this.signer = new ed25519Signer_1.Ed25519Signer(privateKeyBase64 || config.ed25519PrivateKey);
    }
    generateKey() {
        return (0, keyGenerator_1.generateLicenseKey)();
    }
    normalizeKey(rawKey) {
        return (0, keyHasher_1.normalizeLicenseKey)(rawKey);
    }
    validateFormat(rawKey) {
        return (0, keyHasher_1.isValidLicenseKeyFormat)(rawKey);
    }
    hashKey(rawKey) {
        return (0, keyHasher_1.hashLicenseKey)(rawKey, this.secretPepper);
    }
    getLast4(rawKey) {
        return (0, keyHasher_1.getLicenseKeyLast4)(rawKey);
    }
    getPublicKeyBase64() {
        return this.signer.getPublicKey();
    }
    signCertificate(certificate) {
        return this.signer.signCertificate(certificate);
    }
    verifyCertificate(cert, signatureBase64, publicKeyBase64) {
        return ed25519Signer_1.Ed25519Signer.verifyCertificate(cert, signatureBase64, publicKeyBase64 || this.signer.getPublicKey());
    }
}
exports.CryptoService = CryptoService;
//# sourceMappingURL=cryptoService.js.map