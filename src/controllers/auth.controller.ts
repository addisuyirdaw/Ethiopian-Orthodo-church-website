import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { LoginSchema } from '../validators/auth.validator';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await authService.login(email, password);

    res.status(200).json({
      data: result,
      message: 'Authentication successful.',
    });
  }
}

export const authController = new AuthController();
