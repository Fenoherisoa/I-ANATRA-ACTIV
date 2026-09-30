"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Signataire cryptographique Ed25519 des certificats de licence
 * La clé privée reste EXCLUSIVEMENT sur le serveur (Secret Manager).
 * Seule la clé publique est partagée pour vérification hors-ligne.
 * © 2026 RFC OFFICE — Tous droits réservés
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ed25519Signer = void 0;
exports.canonicalizeCertificate = canonicalizeCertificate;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
/**
 * Sérialise un certificat de manière canonique et déterministe
 * Garantit qu'un même certificat produit exactement les mêmes octets quel que soit l'ordre des propriétés
 */
function canonicalizeCertificate(cert) {
    const sortedFeatures = [...(cert.features || [])].sort();
    const canonicalObj = {
        customerId: cert.customerId,
        expiresAt: cert.expiresAt || null,
        features: sortedFeatures,
        installationId: cert.installationId,
        issuedAt: cert.issuedAt,
        licenseId: cert.licenseId,
        licenseType: cert.licenseType,
        productId: cert.productId,
        status: cert.status,
    };
    return JSON.stringify(canonicalObj);
}
class Ed25519Signer {
    secretKeyUint8;
    publicKeyUint8;
    publicKeyBase64;
    constructor(privateKeyBase64, publicKeyBase64) {
        if (privateKeyBase64) {
            const decodedKey = Buffer.from(privateKeyBase64, 'base64');
            if (decodedKey.length === 64) {
                this.secretKeyUint8 = new Uint8Array(decodedKey);
                this.publicKeyUint8 = this.secretKeyUint8.slice(32);
            }
            else if (decodedKey.length === 32) {
                // Graine Ed25519 (seed)
                const keyPair = tweetnacl_1.default.sign.keyPair.fromSeed(new Uint8Array(decodedKey));
                this.secretKeyUint8 = keyPair.secretKey;
                this.publicKeyUint8 = keyPair.publicKey;
            }
            else {
                throw new Error(`Invalid private key length: ${decodedKey.length}. Expected 32 or 64 bytes.`);
            }
        }
        else {
            // Génération automatique (utile pour environnement de test ou initialisation)
            const keyPair = tweetnacl_1.default.sign.keyPair();
            this.secretKeyUint8 = keyPair.secretKey;
            this.publicKeyUint8 = keyPair.publicKey;
        }
        this.publicKeyBase64 = Buffer.from(this.publicKeyUint8).toString('base64');
    }
    /**
     * Retourne la clé publique en base64 pour transmission sécurisée ou vérification
     */
    getPublicKey() {
        return this.publicKeyBase64;
    }
    /**
     * Retourne la clé privée en base64 (destinée uniquement à la configuration Secret Manager)
     */
    getPrivateKeyBase64() {
        return Buffer.from(this.secretKeyUint8).toString('base64');
    }
    /**
     * Signe numériquement un certificat de licence avec l'algorithme Ed25519
     */
    signCertificate(certificate) {
        const canonicalString = canonicalizeCertificate(certificate);
        const dataBytes = Buffer.from(canonicalString, 'utf-8');
        const signatureBytes = tweetnacl_1.default.sign.detached(new Uint8Array(dataBytes), this.secretKeyUint8);
        const signatureBase64 = Buffer.from(signatureBytes).toString('base64');
        return {
            ...certificate,
            signature: signatureBase64,
            publicKey: this.publicKeyBase64,
        };
    }
    /**
     * Vérifie la signature Ed25519 d'un certificat avec une clé publique donnée
     */
    static verifyCertificate(certificate, signatureBase64, publicKeyBase64) {
        try {
            const canonicalString = canonicalizeCertificate(certificate);
            const dataBytes = Buffer.from(canonicalString, 'utf-8');
            const signatureBytes = Buffer.from(signatureBase64, 'base64');
            const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
            return tweetnacl_1.default.sign.detached.verify(new Uint8Array(dataBytes), new Uint8Array(signatureBytes), new Uint8Array(publicKeyBytes));
        }
        catch {
            return false;
        }
    }
}
exports.Ed25519Signer = Ed25519Signer;
//# sourceMappingURL=ed25519Signer.js.map