import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { LoginSchema } from '../validators/auth.validator';
import { resolvePolyglotPayload } from '../utils/polyglot-resolver';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await authService.login(email, password);

    const resolved = resolvePolyglotPayload(result, req.locale ?? 'en');

    res.status(200).json({
      data: resolved,
      message: 'Authentication successful.',
    });
  }
}

export const authController = new AuthController();

