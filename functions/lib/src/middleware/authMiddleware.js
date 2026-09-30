"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Middleware d'authentification et de contrôle d'accès basé sur les rôles (RBAC)
 * Protège les routes administratives via Firebase Authentication
 * Rôles supportés : SUPER_ADMIN, LICENSE_MANAGER, SUPPORT, VIEWER
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminAuthMiddleware = createAdminAuthMiddleware;
const firebase_1 = require("../config/firebase");
function createAdminAuthMiddleware(adminRepo, allowedRoles) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'UNAUTHORIZED',
                    message: "En-tête d'autorisation manquant ou format invalide (Bearer token requis).",
                });
            }
            const idToken = authHeader.split('Bearer ')[1].trim();
            // Vérification du token Firebase Auth
            let decodedToken;
            try {
                decodedToken = await (0, firebase_1.getFirebaseAuth)().verifyIdToken(idToken);
            }
            catch (err) {
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Jeton Firebase Auth invalide ou expiré.',
                });
            }
            const uid = decodedToken.uid;
            const adminRecord = await adminRepo.findById(uid);
            if (!adminRecord || adminRecord.status !== 'ACTIVE') {
                return res.status(403).json({
                    success: false,
                    error: 'FORBIDDEN',
                    message: "Accès refusé : compte administrateur inexistant ou désactivé.",
                });
            }
            if (allowedRoles && !allowedRoles.includes(adminRecord.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'INSUFFICIENT_PERMISSIONS',
                    message: `Rôle requis : ${allowedRoles.join(' ou ')}. Votre rôle actuel : ${adminRecord.role}`,
                });
            }
            req.adminUser = {
                adminId: adminRecord.adminId,
                email: adminRecord.email,
                role: adminRecord.role,
            };
            return next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_AUTH_ERROR',
                message: 'Erreur interne de vérification des droits.',
            });
        }
    };
}
//# sourceMappingURL=authMiddleware.js.map