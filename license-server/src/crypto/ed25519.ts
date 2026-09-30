/**
 * I-ANATRA License Server - RFC OFFICE
 * Cryptographie Ed25519 (RFC 8032)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import nacl from 'tweetnacl';

export interface KeyPairBase64 {
  publicKey: string;
  privateKey: string;
}

/**
 * Encode un Uint8Array en chaîne Base64
 */
export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Décode une chaîne Base64 en Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Génère une nouvelle paire de clés Ed25519 (CSPRNG)
 */
export function generateEd25519KeyPair(): KeyPairBase64 {
  const pair = nacl.sign.keyPair();
  return {
    publicKey: toBase64(pair.publicKey),
    privateKey: toBase64(pair.secretKey),
  };
}

/**
 * Signe des données textuelles avec la clé privée Ed25519 du serveur
 * @param dataString Contenu canonique à signer (JSON stringifié)
 * @param privateKeyBase64 Clé privée 64 octets en base64
 */
export function signData(dataString: string, privateKeyBase64: string): string {
  const secretKey = fromBase64(privateKeyBase64);
  const dataBytes = new TextEncoder().encode(dataString);
  const signatureBytes = nacl.sign.detached(dataBytes, secretKey);
  return toBase64(signatureBytes);
}

/**
 * Vérifie la signature Ed25519 avec la clé publique RFC OFFICE
 * @param dataString Contenu canonique signé
 * @param signatureBase64 Signature en base64
 * @param publicKeyBase64 Clé publique 32 octets en base64
 */
export function verifySignature(
  dataString: string,
  signatureBase64: string,
  publicKeyBase64: string
): boolean {
  try {
    const dataBytes = new TextEncoder().encode(dataString);
    const signatureBytes = fromBase64(signatureBase64);
    const publicKeyBytes = fromBase64(publicKeyBase64);
    return nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}
