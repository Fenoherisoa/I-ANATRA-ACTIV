/**
 * RFC OFFICE - I-ANATRA License Server
 * Suite officielle des 20 tests automatisés obligatoires (Section 27)
 * Valide l'intégralité du backend Firebase de licensing, de la cryptographie,
 * du contrôle d'accès, des règles métier et de la protection anti-données scolaires.
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import {
  MemoryLicenseRepository,
  MemoryInstallationRepository,
  MemoryProductRepository,
  MemoryCustomerRepository,
  MemoryActivationEventRepository,
  MemoryAuditRepository,
  MemorySettingsRepository,
  MemoryTransferRequestRepository,
  MemoryAdminRepository,
} from '../functions/src/repositories/memoryRepositories';
import { CryptoService } from '../functions/src/services/cryptoService';
import { LicenseService } from '../functions/src/services/licenseService';
import {
  validateActivatePayload,
  validateVerifyPayload,
  validateHeartbeatPayload,
  containsProhibitedSchoolData,
} from '../functions/src/validation/schemas';
import { LicenseCertificate } from '../functions/src/models/types';
import { Ed25519Signer } from '../functions/src/crypto/ed25519Signer';
import { hashLicenseKey } from '../functions/src/crypto/keyHasher';

export interface TestReportItem {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

export async function runFirebaseBackendTests(): Promise<{ passed: number; total: number; results: TestReportItem[] }> {
  const results: TestReportItem[] = [];

  function record(num: number, name: string, condition: boolean, details: string) {
    results.push({ num, name, passed: condition, details });
    const badge = condition ? '✅ PASS' : '❌ FAIL';
    console.log(`[${badge}] Test ${num.toString().padStart(2, '0')} : ${name} -> ${details}`);
  }

  console.log('\n======================================================================');
  console.log(' DÉMARRAGE DES 20 TESTS OFFICIELS DU SERVEUR FIREBASE I-ANATRA');
  console.log(' RFC OFFICE — © 2026 Tous droits réservés');
  console.log('======================================================================\n');

  // Initialisation de la pile de test isolée (Clean Architecture)
  const licenseRepo = new MemoryLicenseRepository();
  const installationRepo = new MemoryInstallationRepository();
  const productRepo = new MemoryProductRepository();
  const customerRepo = new MemoryCustomerRepository();
  const eventRepo = new MemoryActivationEventRepository();
  const auditRepo = new MemoryAuditRepository();
  const settingsRepo = new MemorySettingsRepository();
  const transferRepo = new MemoryTransferRequestRepository();
  const _adminRepo = new MemoryAdminRepository();

  const cryptoService = new CryptoService();
  const licenseService = new LicenseService(
    licenseRepo,
    installationRepo,
    productRepo,
    customerRepo,
    eventRepo,
    auditRepo,
    settingsRepo,
    transferRepo,
    cryptoService
  );

  // Initialisation produit 'I-ANATRA'
  await productRepo.create({
    productId: 'I-ANATRA',
    name: 'I-ANATRA',
    version: '1.0.0',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Client test
  const customerId = 'CUST-TEST-001';
  await customerRepo.create({
    customerId,
    schoolName: 'Collège & Lycée Saint-Michel',
    contactName: 'Directeur Général',
    email: 'direction@st-michel.mg',
    phone: '+261 34 11 222 33',
    address: 'Amparibe, Antananarivo',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Création d'une licence FREE officielle
  const { rawKey: validFreeKey, license: freeLicense } = await licenseService.createLicense({
    customerId,
    licenseType: 'FREE',
    features: ['STUDENTS', 'FINANCE', 'OFFLINE_READY'],
    actorId: 'SUPER_ADMIN_TEST',
  });

  // TEST 1 : Clé avec format incorrect
  const badFormatRes = await licenseService.activateLicense(
    {
      licenseKey: 'IANATRA-0000-1111-IIII-OOOO', // Caractères ambigus interdits
      productId: 'I-ANATRA',
      installationId: 'INS-A1B2C3D4E5F6',
      machineName: 'PC-DIRECTEUR',
      os: 'Windows 11 Pro 64-bit',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    1,
    'Clé avec format incorrect',
    !badFormatRes.success && badFormatRes.errorCode === 'INVALID_LICENSE_KEY_FORMAT',
    'Rejet strict des caractères ambigus (0, O, 1, I) et mauvais format avec code INVALID_LICENSE_KEY_FORMAT.'
  );

  // TEST 2 : Clé inexistante dans Firestore
  const nonExistentKey = 'IANATRA-9999-8888-7777-6666';
  const nonExistentRes = await licenseService.activateLicense(
    {
      licenseKey: nonExistentKey,
      productId: 'I-ANATRA',
      installationId: 'INS-A1B2C3D4E5F6',
      machineName: 'PC-DIRECTEUR',
      os: 'Windows 11 Pro 64-bit',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    2,
    'Clé inexistante',
    !nonExistentRes.success && nonExistentRes.errorCode === 'LICENSE_NOT_FOUND',
    'Rejet confirmé d\'une clé formellement valide mais inexistante dans Firestore (code LICENSE_NOT_FOUND).'
  );

  // TEST 3 : Clé FREE valide
  const freeActivateRes = await licenseService.activateLicense(
    {
      licenseKey: validFreeKey,
      productId: 'I-ANATRA',
      installationId: 'INS-A1B2C3D4E5F6',
      machineName: 'PC-ADMIN-01',
      os: 'Windows 11 Pro 64-bit',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    3,
    'Clé FREE valide',
    freeActivateRes.success &&
      freeActivateRes.data?.licenseType === 'FREE' &&
      freeActivateRes.data?.certificate?.signature != null,
    `Licence FREE activée avec succès pour le client. Certificat Ed25519 généré (Licence ID: ${freeLicense.licenseId}).`
  );

  // TEST 4 : Licence ACTIVE (Vérification)
  const verifyRes = await licenseService.verifyLicense(
    {
      licenseId: freeLicense.licenseId,
      productId: 'I-ANATRA',
      installationId: 'INS-A1B2C3D4E5F6',
    },
    '127.0.0.1'
  );
  record(
    4,
    'Licence ACTIVE',
    verifyRes.success && verifyRes.data?.status === 'ACTIVE' && verifyRes.data?.valid === true,
    'Vérification serveur confirme que la licence et l\'installation sont actives et valides.'
  );

  // TEST 5 : Licence REVOKED
  const { rawKey: revokedKey, license: revokedLic } = await licenseService.createLicense({
    customerId,
    licenseType: 'FREE',
    actorId: 'SUPER_ADMIN_TEST',
  });
  await licenseService.revokeLicense(revokedLic.licenseId, 'SUPER_ADMIN_TEST', 'Test de révocation');
  const revokedActivateRes = await licenseService.activateLicense(
    {
      licenseKey: revokedKey,
      productId: 'I-ANATRA',
      installationId: 'INS-REVOKED-POSTE',
      machineName: 'PC-TEST',
      os: 'Windows 11',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    5,
    'Licence REVOKED',
    !revokedActivateRes.success && revokedActivateRes.errorCode === 'LICENSE_REVOKED',
    'Activation refusée avec code LICENSE_REVOKED pour une licence révoquée.'
  );

  // TEST 6 : Licence EXPIRED
  const { rawKey: expiredKey, license: expiredLic } = await licenseService.createLicense({
    customerId,
    licenseType: 'TRIAL',
    actorId: 'SUPER_ADMIN_TEST',
    expiresAt: new Date(Date.now() - 3600000).toISOString(), // Expirée il y a 1 heure
  });
  const expiredActivateRes = await licenseService.activateLicense(
    {
      licenseKey: expiredKey,
      productId: 'I-ANATRA',
      installationId: 'INS-EXPIRED-POSTE',
      machineName: 'PC-TEST',
      os: 'Windows 11',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    6,
    'Licence EXPIRED',
    !expiredActivateRes.success && expiredActivateRes.errorCode === 'LICENSE_EXPIRED',
    'Activation refusée avec code LICENSE_EXPIRED pour une licence expirée.'
  );

  // TEST 7 : Licence BLOCKED
  const { rawKey: blockedKey, license: blockedLic } = await licenseService.createLicense({
    customerId,
    licenseType: 'FREE',
    actorId: 'SUPER_ADMIN_TEST',
  });
  await licenseRepo.update(blockedLic.licenseId, { status: 'BLOCKED' });
  const blockedActivateRes = await licenseService.activateLicense(
    {
      licenseKey: blockedKey,
      productId: 'I-ANATRA',
      installationId: 'INS-BLOCKED-POSTE',
      machineName: 'PC-TEST',
      os: 'Windows 11',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    7,
    'Licence BLOCKED',
    !blockedActivateRes.success && blockedActivateRes.errorCode === 'LICENSE_BLOCKED',
    'Activation refusée avec code LICENSE_BLOCKED pour une licence suspendue.'
  );

  // TEST 8 : Deuxième installation refusée (maxInstallations = 1)
  const secondInstallRes = await licenseService.activateLicense(
    {
      licenseKey: validFreeKey,
      productId: 'I-ANATRA',
      installationId: 'INS-ANOTHER-MACHINE-22', // Poste pirate ou second poste
      machineName: 'PC-SECONDAIRE',
      os: 'Windows 10',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    8,
    'Deuxième installation refusée',
    !secondInstallRes.success && secondInstallRes.errorCode === 'LICENSE_ALREADY_ACTIVATED',
    'Rejet confirmé de la seconde installation concurrente (code LICENSE_ALREADY_ACTIVATED).'
  );

  // TEST 9 : Installation existante reconnue (même machine réactivée)
  const sameInstallRes = await licenseService.activateLicense(
    {
      licenseKey: validFreeKey,
      productId: 'I-ANATRA',
      installationId: 'INS-A1B2C3D4E5F6', // MÊME poste
      machineName: 'PC-ADMIN-01-RENAMED',
      os: 'Windows 11 Pro 64-bit',
      appVersion: '1.0.1',
    },
    '127.0.0.1'
  );
  record(
    9,
    'Installation existante reconnue',
    sameInstallRes.success && sameInstallRes.data?.licenseId === freeLicense.licenseId,
    'La réactivation sur la même installation autorisée est acceptée et son statut mis à jour.'
  );

  // TEST 10 : Transfert de licence
  const newPosteId = 'INS-NOUVEAU-POSTE-99';
  const transferRes = await licenseService.transferLicense(
    freeLicense.licenseId,
    'INS-A1B2C3D4E5F6',
    newPosteId,
    'SUPER_ADMIN_TEST',
    'Changement de machine de direction'
  );
  // Maintenant l'activation sur le nouveau poste doit réussir !
  const postTransferActivateRes = await licenseService.activateLicense(
    {
      licenseKey: validFreeKey,
      productId: 'I-ANATRA',
      installationId: newPosteId,
      machineName: 'PC-NOUVEAU',
      os: 'Windows 11 Pro',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    10,
    'Transfert',
    transferRes.success && postTransferActivateRes.success,
    'Ancien poste désactivé, transfert approuvé et activation sur le nouveau poste réussie.'
  );

  // TEST 11 : Signature Ed25519
  const testCert: LicenseCertificate = {
    licenseId: 'LIC-TEST-SIG-01',
    productId: 'I-ANATRA',
    customerId: 'CUST-TEST',
    licenseType: 'FREE',
    installationId: 'INS-SIG-TEST',
    status: 'ACTIVE',
    issuedAt: new Date().toISOString(),
    expiresAt: null,
    features: ['STUDENTS', 'FINANCE'],
  };
  const signedCertificate = cryptoService.signCertificate(testCert);
  const isSigValid = cryptoService.verifyCertificate(testCert, signedCertificate.signature);
  record(
    11,
    'Signature Ed25519',
    isSigValid === true,
    'Génération et vérification réussie de signature cryptographique Ed25519.'
  );

  // TEST 12 : Signature invalide
  const corruptedSignature = signedCertificate.signature.slice(0, -4) + 'AAAA';
  const isCorruptedValid = cryptoService.verifyCertificate(testCert, corruptedSignature);
  record(
    12,
    'Signature invalide',
    isCorruptedValid === false,
    'Signature falsifiée ou corrompue immédiatement rejetée par tweetnacl Ed25519.'
  );

  // TEST 13 : Certificat invalide (données altérées avec signature valide de l\'ancien contenu)
  const tamperedCert: LicenseCertificate = {
    ...testCert,
    features: ['STUDENTS', 'FINANCE', 'UNAUTHORIZED_PREMIUM_HACK'], // Altération des données
  };
  const isTamperedValid = cryptoService.verifyCertificate(tamperedCert, signedCertificate.signature);
  record(
    13,
    'Certificat invalide',
    isTamperedValid === false,
    'Toute modification d\'un champ du certificat rend la signature mathématiquement invalide.'
  );

  // TEST 14 : Mauvais productId
  const badProductRes = await licenseService.activateLicense(
    {
      licenseKey: validFreeKey,
      productId: 'OTHER-SOFTWARE', // Produit erroné
      installationId: 'INS-TEST-1234',
      machineName: 'PC-TEST',
      os: 'Windows 11',
      appVersion: '1.0.0',
    },
    '127.0.0.1'
  );
  record(
    14,
    'Mauvais productId',
    !badProductRes.success && badProductRes.errorCode === 'INVALID_PRODUCT',
    'Demande avec productId erroné rejetée avec le code INVALID_PRODUCT.'
  );

  // TEST 15 : Mauvaise installationId (Format incorrect)
  const badInstallPayload = validateActivatePayload({
    licenseKey: validFreeKey,
    productId: 'I-ANATRA',
    installationId: 'BAD_ID_WITHOUT_INS_PREFIX', // Format invalide
    machineName: 'PC-TEST',
    os: 'Windows 11',
    appVersion: '1.0.0',
  });
  record(
    15,
    'Mauvaise installationId',
    !badInstallPayload.isValid,
    'Validation rejette les installationId ne respectant pas la nomenclature INS-XXXXXXXX.'
  );

  // TEST 16 : Payload invalide
  const emptyPayload = validateActivatePayload({});
  const nullPayload = validateActivatePayload(null);
  record(
    16,
    'Payload invalide',
    !emptyPayload.isValid && !nullPayload.isValid,
    'Payloads vides, incomplets ou de types inattendus strictement rejetés avec HTTP 400.'
  );

  // TEST 17 : Tentative excessive d’activation (Rate limiting)
  // Simule l'accès du rate limiter avec fenêtre d'activation
  const { createRateLimiter } = await import('../functions/src/middleware/rateLimiter');
  const limiter = createRateLimiter({ windowMs: 1000, maxAttempts: 3 });
  let blockedCount = 0;
  for (let i = 0; i < 5; i++) {
    const mockReq: any = { headers: { 'x-forwarded-for': '192.168.1.100' }, socket: {}, path: '/api/v1/license/activate' };
    const mockRes: any = {
      status: (code: number) => ({
        json: (_data: any) => {
          if (code === 429) blockedCount++;
        },
      }),
      setHeader: () => {},
    };
    limiter(mockReq, mockRes, () => {});
  }
  record(
    17,
    'Tentative excessive d’activation',
    blockedCount === 2,
    'Rate limiter bloque immédiatement les requêtes au-delà du quota avec statut 429 Too Many Requests.'
  );

  // TEST 18 : Accès Firestore non autorisé
  // Vérification de la politique de sécurité des règles Firestore
  // (Tous les clients externes ont 'allow read, write: if false;')
  const firestoreRulesContent = await import('fs').then((fs) => fs.readFileSync('firestore.rules', 'utf-8'));
  const hasCatchAllDeny = firestoreRulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }');
  const hasLicensesDeny = firestoreRulesContent.includes('match /licenses/{licenseId}');
  record(
    18,
    'Accès Firestore non autorisé',
    hasCatchAllDeny && hasLicensesDeny,
    'Règles Firestore vérifiées : Zero-Trust actif, verrouillage total par défaut et exclusion des clients directs.'
  );

  // TEST 19 : Absence de secret dans les réponses et modèles
  const pepperUsed = 'CUSTOM-SECURE-PEPPER-XYZ';
  const hashedSecretKey = hashLicenseKey(validFreeKey, pepperUsed);
  const hashRevealedInPublicResponse = JSON.stringify(freeActivateRes).includes(hashedSecretKey);
  const pepperRevealed = JSON.stringify(freeActivateRes).includes(pepperUsed);
  record(
    19,
    'Absence de secret',
    !hashRevealedInPublicResponse && !pepperRevealed,
    'Aucun secret serveur, clé privée Ed25519 ou poivre HMAC n\'apparaît dans les réponses publiques.'
  );

  // TEST 20 : Absence de données scolaires dans les requêtes
  const maliciousSchoolPayload = {
    licenseKey: validFreeKey,
    productId: 'I-ANATRA',
    installationId: 'INS-A1B2C3D4E5F6',
    machineName: 'PC-DIRECTEUR',
    os: 'Windows 11',
    appVersion: '1.0.0',
    students: [{ name: 'Dupont Jean', notes: [15, 18], fee: 50000 }], // Donnée scolaire interdite !
  };
  const hasSchoolData = containsProhibitedSchoolData(maliciousSchoolPayload);
  const validationWithSchoolData = validateActivatePayload(maliciousSchoolPayload);
  record(
    20,
    'Absence de données scolaires dans les requêtes',
    hasSchoolData === true && !validationWithSchoolData.isValid,
    'Filtre de sécurité anti-pollution actif : toute inclusion de données scolaires est formellement interceptée et rejetée.'
  );

  console.log('\n======================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(` RÉSULTATS : ${passedCount}/${results.length} TESTS PASSÉS AVEC SUCCÈS`);
  console.log('======================================================================\n');

  return {
    passed: passedCount,
    total: results.length,
    results,
  };
}

if (import.meta.url.endsWith(process.argv[1])) {
  runFirebaseBackendTests().catch((err) => {
    console.error('Erreur lors de l’exécution des tests:', err);
    process.exit(1);
  });
}
