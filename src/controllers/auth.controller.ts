import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { LoginSchema, SignupSchema } from '../validators/auth.validator';
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

  async signup(req: Request, res: Response): Promise<void> {
    const parsed = SignupSchema.parse(req.body);
    const { email, password, fullName, sex, institutionId } = parsed;
    const extra = {
      christianName: parsed.christianName,
      birthDate: parsed.birthDate,
      phoneNumber: parsed.phoneNumber,
      region: parsed.region,
      city: parsed.city,
      address: parsed.address,
      baptismStatus: parsed.baptismStatus,
      photoUrl: parsed.photoUrl,
    };
    
    const result = await authService.signup(email, password, fullName, sex, institutionId, extra);

    const resolved = resolvePolyglotPayload(result, req.locale ?? 'en');

    res.status(201).json({
      data: resolved,
      message: 'Signup successful. Welcome to OrthodoxConnect.',
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    // In a stateless JWT setup, logout on server can be a success message
    // Client deletes token from storage
    res.status(200).json({ message: 'Logged out successfully.' });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required.' });
      return;
    }

    try {
      const { JWT_SECRET } = require('../middleware/auth.middleware');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      
      const { userRepository } = require('../repositories/user.repository');
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        res.status(401).json({ error: 'User not found.' });
        return;
      }

      // Re-issue access token
      const payload = {
        sub: user.id,
        institution_id: user.institutionId,
        hierarchy_path: user.institution.hierarchyPath,
        ecclesiastical_role: user.ecclesiasticalRole,
        auth_role: user.authRole,
        isSuperAdmin: user.ecclesiasticalRole === 'PATRIARCH',
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({ token });
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { userRepository } = require('../repositories/user.repository');
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.status(200).json({ user });
  }
}

export const authController = new AuthController();


