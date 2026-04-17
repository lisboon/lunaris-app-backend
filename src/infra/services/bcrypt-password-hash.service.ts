import * as bcrypt from 'bcrypt';
import { PasswordHashService } from '@/modules/@shared/domain/services/password-hash.service';

export class BcryptPasswordHashService implements PasswordHashService {
  private readonly SALT_ROUNDS = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}