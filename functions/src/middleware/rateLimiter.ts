/**
 * RFC OFFICE - I-ANATRA License Server
 * Rate Limiting Middleware
 * Protège les endpoints d'activation, de vérification et de heartbeat contre les attaques par déni de service et force brute
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number; // Fenêtre temporelle en millisecondes
  maxAttempts: number; // Nombre maximal d'essais autorisés
  message?: string;
}

/**
 * Nettoyage périodique des entrées expirées pour éviter toute fuite mémoire
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxAttempts, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Clé basée sur l'IP cliente + l'identifiant d'installation ou route
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const clientKey = `${Array.isArray(ip) ? ip[0] : ip.toString()}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(clientKey);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(clientKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxAttempts) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        retryAfterSeconds,
      });
    }

    record.count++;
    return next();
  };
}

/**
 * Réinitialise le rate limiter (utile pour tests)
 */
export function resetRateLimiter(): void {
  rateLimitMap.clear();
}
