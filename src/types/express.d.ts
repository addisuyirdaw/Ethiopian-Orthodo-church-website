import { AuthenticatedUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      locale?: 'en' | 'am' | 'gez';
    }
  }
}

export {};
