/**
 * I-ANATRA License Server - RFC OFFICE
 * Rate Limiter en mémoire contre les attaques par force brute
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const hits = new Map<string, RateLimitRecord>();

/**
 * Middleware de limitation du débit (Rate Limiting)
 * @param windowMs Fenêtre de temps en millisecondes
 * @param maxAttempts Nombre maximum de requêtes autorisées
 */
export function rateLimiter(windowMs: number = 60000, maxAttempts: number = 10) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = hits.get(key);

    if (!record || now > record.resetTime) {
      hits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxAttempts) {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMITED',
        message: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
      });
      return;
    }

    next();
  };
}
