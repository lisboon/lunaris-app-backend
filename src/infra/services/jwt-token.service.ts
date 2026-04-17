import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import {
  JwtTokenService,
  JwtPayloadData,
} from '@/modules/@shared/domain/services/jwt-token.service';

export class JwtTokenServiceImpl implements JwtTokenService {
  private readonly secret: string;
  private readonly expiresIn: SignOptions['expiresIn'];

  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback-secret';
    this.expiresIn = (process.env.JWT_EXPIRES_IN ||
      '7d') as SignOptions['expiresIn'];
  }

  sign(payload: JwtPayloadData): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayloadData {
    return jwt.verify(token, this.secret) as JwtPayloadData;
  }
}