import { User } from '../../domain/user.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const validProps = () => ({
  email: 'geralt@rivia.com',
  name: 'Geralt of Rivia',
  password: '$2b$10$hashedpassword',
});

describe('User', () => {
  describe('create', () => {
    it('builds a valid user with defaults', () => {
      const user = User.create(validProps());
      expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(user.email).toBe('geralt@rivia.com');
      expect(user.name).toBe('Geralt of Rivia');
      expect(user.active).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeUndefined();
    });

    it('throws EntityValidationError when email is invalid', () => {
      expect(() =>
        User.create({ ...validProps(), email: 'not-an-email' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when name is too short', () => {
      expect(() =>
        User.create({ ...validProps(), name: 'x' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when password is empty', () => {
      expect(() =>
        User.create({ ...validProps(), password: '' }),
      ).toThrow(EntityValidationError);
    });

    it('normalizes email (trim + lowercase)', () => {
      const user = User.create({ ...validProps(), email: '  Geralt@Rivia.COM ' });
      expect(user.email).toBe('geralt@rivia.com');
    });
  });

  describe('updateUser', () => {
    it('changes name and refreshes updatedAt', async () => {
      const user = User.create(validProps());
      const before = user.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 2));
      user.updateUser({ name: 'Ciri of Cintra' });
      expect(user.name).toBe('Ciri of Cintra');
      expect(user.updatedAt.getTime()).toBeGreaterThan(before);
    });

    it('changes email', () => {
      const user = User.create(validProps());
      user.updateUser({ email: 'ciri@cintra.com' });
      expect(user.email).toBe('ciri@cintra.com');
    });

    it('normalizes email on change', () => {
      const user = User.create(validProps());
      user.updateUser({ email: '  Ciri@Cintra.COM ' });
      expect(user.email).toBe('ciri@cintra.com');
    });

    it('throws EntityValidationError when email is invalid', () => {
      const user = User.create(validProps());
      expect(() => user.updateUser({ email: 'bad-email' })).toThrow(
        EntityValidationError,
      );
    });
  });

  describe('changePassword', () => {
    it('replaces hashed password', () => {
      const user = User.create(validProps());
      user.changePassword('$2b$10$newhashedpassword');
      expect(user.password).toBe('$2b$10$newhashedpassword');
    });
  });

  describe('toJSON', () => {
    it('omits password field', () => {
      const user = User.create(validProps());
      const json = user.toJSON();
      expect(json).not.toHaveProperty('password');
      expect(json).toMatchObject({
        id: user.id,
        email: 'geralt@rivia.com',
        name: 'Geralt of Rivia',
        active: true,
      });
    });
  });
});
