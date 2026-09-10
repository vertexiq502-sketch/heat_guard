import { Request, Response, NextFunction } from 'express';
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Mock rate limiter
  next();
};