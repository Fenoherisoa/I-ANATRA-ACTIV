# RFC OFFICE — Serveur d'Activation et de Licences I-ANATRA (Firebase)

**Éditeur / Développeur :** RFC OFFICE  
**Produit :** I-ANATRA  
**Infrastructure :** Firebase (Cloud Functions v2, Cloud Firestore, Firebase Authentication, Secret Manager)  
**Mode de distribution actuel :** `FREE` (Prix : 0 Ar, Installations max : 1)  
**Extension future prévue sans refactorisation :** `TRIAL`, `ANNUAL`, `PERPETUAL`  
**Migration future :** Couche métier agnostique (Clean Architecture) permettant de migrer vers un serveur dédié / VPS / PostgreSQL sans réécriture.  
**Copyright :** © 2026 RFC OFFICE — Tous droits réservés  

---

## 1. Architecture Générale

```text
                                INTERNET
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    RFC OFFICE LICENSE SERVER  │
                   │                               │
                   │ Firebase Cloud Functions v2   │
                   │ Cloud Firestore               │
                   │ Secret Manager (Ed25519)      │
                   └───────────────┬───────────────┘
                                   │
                                   │ HTTPS REST API
                                   ▼
                             I-ANATRA.exe
                        (Poste École Windows)
```

### Règle d'Isolation Absolue des Données Scolaires
Le serveur de licences RFC OFFICE ne reçoit, ne traite et ne stocke **JAMAIS** de données scolaires (élèves, professeurs, notes, bulletins, frais, paiements, SQLite). Un filtre de sécurité bloque immédiatement avec un code HTTP 400 toute requête suspecte contenant des termes scolaires.

---

## 2. Structure du Projet

```text
RFC-OFFICE-LICENSE-SERVER/
├── functions/
│   ├── src/
│   │   ├── api/
│   │   │   └── routes.ts              # Routage Express avec rate limiter et auth RBAC
│   │   ├── controllers/
│   │   │   ├── licenseController.ts   # Endpoints publics (activate, verify, heartbeat)
│   │   │   └── adminController.ts     # Endpoints privés (generate, revoke, transfer, list)
│   │   ├── services/
│   │   │   ├── licenseService.ts      # Logique métier pure (indépendante de Firestore)
│   │   │   └── cryptoService.ts       # Signatures Ed25519, hash HMAC-SHA256, générateur
│   │   ├── repositories/
│   │   │   ├── interfaces.ts          # Interfaces de persistance (Clean Architecture)
│   │   │   ├── firestoreRepositories.ts # Implémentation Cloud Firestore
│   │   │   └── memoryRepositories.ts  # Implémentation in-memory (tests et validation)
│   │   ├── crypto/
│   │   │   ├── keyGenerator.ts        # Générateur CSPRNG 2^80 combinaisons
│   │   │   ├── keyHasher.ts           # HMAC-SHA256 avec poivre secret
│   │   │   └── ed25519Signer.ts       # Signature et vérification Ed25519
│   │   ├── middleware/
│   │   │   ├── rateLimiter.ts         # Protection anti-brute force (10 req/min)
│   │   │   └── authMiddleware.ts      # Contrôle d'accès Firebase Auth RBAC
│   │   ├── validation/
│   │   │   └── schemas.ts             # Validation stricte des entrées et filtre anti-pollution
│   │   ├── models/
│   │   │   └── types.ts               # Types TypeScript officiels
│   │   ├── config/
│   │   │   └── firebase.ts            # Configuration Firebase Admin SDK et secrets
│   │   └── index.ts                   # Point d'entrée HTTPS Cloud Functions
│   ├── package.json
│   └── tsconfig.json
│
├── firestore.rules                    # Règles de sécurité Firestore Zero-Trust
├── firestore.indexes.json             # Définition des index composés Firestore
├── firebase.json                      # Configuration Firebase CLI et émulateurs
├── .firebaserc                        # Association du projet Firebase (rfc-office-ianatra)
├── .env.example                       # Gabarit de configuration et de secrets
└── tests/
    └── firebase-backend.test.ts       # 20 tests obligatoires validant l'ensemble du système
```

---

## 3. Collections Firestore

1. **`products/`** : Catalogue de produits RFC OFFICE (`I-ANATRA`).
   - `productId`: `"I-ANATRA"`
   - `name`: `"I-ANATRA"`
   - `version`: `"1.0.0"`
   - `status`: `"ACTIVE"`
   - `createdAt`, `updatedAt`

2. **`customers/`** : Informations administratives des établissements scolaires licenciés.
   - `customerId`: `"CUST-..."`
   - `schoolName`, `contactName`, `email`, `phone`, `address`, `status`, `createdAt`, `updatedAt`

3. **`licenses/`** : Licences logicielles émises.
   - `licenseId`: `"LIC-..."`
   - `productId`: `"I-ANATRA"`
   - `customerId`: `"CUST-..."`
   - `licenseKeyHash`: Empreinte HMAC-SHA256 (la clé brute n'est jamais stockée).
   - `licenseKeyLast4`: 4 derniers caractères pour repérage visuel (ex: `NPQR`).
   - `licenseType`: `"FREE" | "TRIAL" | "ANNUAL" | "PERPETUAL"` (actuellement `FREE`).
   - `status`: `"PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED" | "BLOCKED"`.
   - `price`: `0` pour FREE.
   - `currency`: `"MGA"`.
   - `maxInstallations`: `1` (par défaut).
   - `features`: `["STUDENTS", "FINANCE", "OFFLINE_READY"]`.
   - `createdAt`, `activatedAt`, `expiresAt`, `lastVerification`.

4. **`installations/`** : Postes de travail autorisés.
   - `installationId`: Identifiant matériel stable `"INS-XXXXXXXXXXXX"`.
   - `licenseId`, `productId`, `machineName`, `os`, `appVersion`, `activatedAt`, `lastSeenAt`, `status`.

5. **`activationEvents/`** : Piste chronologique des activations, vérifications et heartbeats.
   - `eventId`, `licenseId`, `installationId`, `productId`, `eventType`, `result`, `timestamp`, `ipAddress`, `appVersion`.

6. **`transferRequests/`** : Historique des transferts autorisés par l'administration.
   - `requestId`, `licenseId`, `fromInstallationId`, `toInstallationId`, `reason`, `requestedAt`, `approvedAt`, `approvedBy`, `status`.

7. **`auditLogs/`** : Journal immuable des opérations de sécurité.
   - `auditId`, `action`, `actorId`, `licenseId`, `customerId`, `timestamp`, `result`, `metadata`.

8. **`settings/`** : Configuration globale du serveur (ex: `gracePeriodDays: 30`).

9. **`admins/`** : Administrateurs RFC OFFICE avec rôles (`SUPER_ADMIN`, `LICENSE_MANAGER`, `SUPPORT`, `VIEWER`).

---

## 4. Format et Cryptographie de la Clé

- **Format :** `IANATRA-XXXX-XXXX-XXXX-XXXX`
- **Alphabet :** `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (32 caractères, exclut `0`, `O`, `1`, `I` pour éliminer les erreurs de lecture et de saisie).
- **Entropie :** $32^{16} = 2^{80} \approx 1.2 \times 10^{24}$ combinaisons. Toute recherche par force brute est mathématiquement impossible.
- **Stockage :** HMAC-SHA256 avec un poivre serveur secret (`HMAC_SECRET`).
- **Signature des certificats :** Asymétrique **Ed25519** (64 octets). La clé privée reste exclusivement dans Firebase Secret Manager.

---

## 5. Spécification des Endpoints de l'API

### A. Activation : `POST /api/v1/license/activate`
- **Headers :** `Content-Type: application/json`
- **Payload :**
  ```json
  {
    "licenseKey": "IANATRA-A7K9-M2Q4-X8P5-R6T3",
    "productId": "I-ANATRA",
    "installationId": "INS-A1B2C3D4E5F6",
    "machineName": "PC-DIRECTION-01",
    "os": "Windows 11 Pro 64-bit",
    "appVersion": "1.0.0"
  }
  ```
- **Réponse HTTP 200 (Succès) :**
  ```json
  {
    "success": true,
    "data": {
      "status": "ACTIVE",
      "licenseId": "LIC-693718-TRL6",
      "productId": "I-ANATRA",
      "licenseType": "FREE",
      "certificate": {
        "licenseId": "LIC-693718-TRL6",
        "productId": "I-ANATRA",
        "customerId": "CUST-TEST-001",
        "licenseType": "FREE",
        "installationId": "INS-A1B2C3D4E5F6",
        "status": "ACTIVE",
        "issuedAt": "2026-09-30T08:41:33.488Z",
        "expiresAt": null,
        "features": ["FINANCE", "OFFLINE_READY", "STUDENTS"],
        "signature": "3mK2...Base64...==",
        "publicKey": "X8v2...Base64...=="
      }
    },
    "message": "Activation réussie avec succès."
  }
  ```
- **Codes d'erreur :**
  - `400 BAD_REQUEST` : Format de clé ou de paramètres invalide, ou présence de données scolaires.
  - `403 LICENSE_REVOKED` / `LICENSE_BLOCKED` / `LICENSE_EXPIRED` : Statut invalide.
  - `404 LICENSE_NOT_FOUND` : Clé inexistante dans Firestore.
  - `409 LICENSE_ALREADY_ACTIVATED` : Tentative de double activation sur un autre poste.
  - `429 RATE_LIMIT_EXCEEDED` : Plus de 10 tentatives par minute.

### B. Vérification : `POST /api/v1/license/verify`
- **Payload :**
  ```json
  {
    "licenseId": "LIC-693718-TRL6",
    "productId": "I-ANATRA",
    "installationId": "INS-A1B2C3D4E5F6"
  }
  ```
- **Réponse HTTP 200 :**
  ```json
  {
    "success": true,
    "data": {
      "valid": true,
      "status": "ACTIVE",
      "licenseId": "LIC-693718-TRL6",
      "productId": "I-ANATRA",
      "licenseType": "FREE",
      "expiresAt": null
    },
    "message": "Licence valide et active."
  }
  ```

### C. Heartbeat : `POST /api/v1/license/heartbeat`
- **Payload :**
  ```json
  {
    "licenseId": "LIC-693718-TRL6",
    "productId": "I-ANATRA",
    "installationId": "INS-A1B2C3D4E5F6",
    "appVersion": "1.0.0"
  }
  ```
- **Réponse HTTP 200 :**
  ```json
  {
    "success": true,
    "data": {
      "received": true,
      "status": "ACTIVE",
      "lastSeenAt": "2026-09-30T08:45:00.000Z"
    },
    "message": "Heartbeat reçu avec succès."
  }
  ```

### D. Endpoints Administrateur (Protégés par Firebase Auth Bearer Token)
- `POST /api/v1/admin/licenses/generate`
- `POST /api/v1/admin/licenses/:id/revoke`
- `POST /api/v1/admin/licenses/:id/transfer`
- `GET  /api/v1/admin/licenses`

---

## 6. Procédure de Déploiement Firebase

### Étape 1 : Connexion et sélection du projet
```bash
# Se connecter à Firebase CLI avec le compte propriétaire RFC OFFICE
firebase login

# Sélectionner le projet Firebase dédié
firebase use rfc-office-ianatra
```

### Étape 2 : Configuration des Secrets dans Secret Manager
```bash
# Définir le poivre cryptographique HMAC-SHA256
firebase functions:secrets:set HMAC_SECRET

# Définir la clé privée Ed25519 (Format Base64, 32 ou 64 octets)
firebase functions:secrets:set ED25519_PRIVATE_KEY
```

### Étape 3 : Test avec la Suite d'Émulateurs Locale
```bash
# Lancer les émulateurs Cloud Functions et Firestore
firebase emulators:start --only functions,firestore,auth
```

### Étape 4 : Déploiement en Production
```bash
# Compiler le code TypeScript des Cloud Functions
cd functions && npm run build && cd ..

# Déployer les règles Firestore et les index
firebase deploy --only firestore

# Déployer les Cloud Functions HTTPS
firebase deploy --only functions
```

### URL d'accès après déploiement :
```text
https://europe-west1-rfc-office-ianatra.cloudfunctions.net/api
```

---

## 7. Résultats des 20 Tests Obligatoires

La suite de tests automatisée `npx tsx tests/firebase-backend.test.ts` a validé avec succès l'ensemble des 20 points de contrôle :

| N° | Intitulé du Test | Résultat | Détail technique validé |
|:---|:---|:---:|:---|
| 01 | Clé avec format incorrect | ✅ PASS | Caractères ambigus (0, O, 1, I) rejetés (`INVALID_LICENSE_KEY_FORMAT`). |
| 02 | Clé inexistante | ✅ PASS | Clé au format valide mais absente de la base rejetée (`LICENSE_NOT_FOUND`). |
| 03 | Clé FREE valide | ✅ PASS | Licence activée, certificat signé Ed25519 généré sans bypass. |
| 04 | Licence ACTIVE | ✅ PASS | Vérification serveur confirme l'état valide et actif du poste. |
| 05 | Licence REVOKED | ✅ PASS | Activation immédiatement refusée (`LICENSE_REVOKED`). |
| 06 | Licence EXPIRED | ✅ PASS | Activation refusée si la date de fin est dépassée (`LICENSE_EXPIRED`). |
| 07 | Licence BLOCKED | ✅ PASS | Blocage de sécurité administratif actif (`LICENSE_BLOCKED`). |
| 08 | Deuxième installation refusée | ✅ PASS | Double activation concurrente rejetée (`LICENSE_ALREADY_ACTIVATED`). |
| 09 | Installation existante reconnue | ✅ PASS | Réactivation sur le même poste acceptée et lastSeenAt rafraîchi. |
| 10 | Transfert | ✅ PASS | Ancien poste désactivé, nouveau poste autorisé avec piste d'audit. |
| 11 | Signature Ed25519 | ✅ PASS | Génération et vérification cryptographique asymétrique réussies. |
| 12 | Signature invalide | ✅ PASS | Signature altérée immédiatement détectée et rejetée. |
| 13 | Certificat invalide | ✅ PASS | Modification des features ou d'un champ rend la signature invalide. |
| 14 | Mauvais productId | ✅ PASS | Rejet si productId ≠ `'I-ANATRA'` (`INVALID_PRODUCT`). |
| 15 | Mauvaise installationId | ✅ PASS | Format `INS-XXXXXXXX` obligatoire, identifiants erronés rejetés. |
| 16 | Payload invalide | ✅ PASS | Payloads vides ou mal formés rejetés avec HTTP 400. |
| 17 | Tentative excessive (Rate limiting)| ✅ PASS | Quota de 10 req/min appliqué avec HTTP 429 Too Many Requests. |
| 18 | Accès Firestore non autorisé | ✅ PASS | Règles Zero-Trust validées (`allow read, write: if false;`). |
| 19 | Absence de secret | ✅ PASS | Aucun secret ni poivre HMAC dans les réponses publiques de l'API. |
| 20 | Absence de données scolaires | ✅ PASS | Filtre anti-pollution intercepte et rejette toute donnée scolaire. |

**Score final : 20/20 tests passés avec succès.**
