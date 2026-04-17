import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { User } from '../../domain/user.entity';

const validProps = () => ({
  email: 'john@studio.com',
  name: 'John Doe',
  password: 'hashed_password_here',
});

describe('User', () => {
  describe('create', () => {
    it('builds a valid user with defaults', () => {
      const user = User.create(validProps());
      expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(user.email).toBe('john@studio.com');
      expect(user.name).toBe('John Doe');
      expect(user.password).toBe('hashed_password_here');
      expect(user.avatarUrl).toBeUndefined();
      expect(user.active).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeUndefined();
    });

    it('throws when email is invalid', () => {
      expect(() =>
        User.create({ ...validProps(), email: 'not-an-email' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when name is too short', () => {
      expect(() => User.create({ ...validProps(), name: 'x' })).toThrow(
        EntityValidationError,
      );
    });

    it('throws when password is empty', () => {
      expect(() => User.create({ ...validProps(), password: '' })).toThrow(
        EntityValidationError,
      );
    });
  });

  describe('updateUser', () => {
    it('changes name', () => {
      const user = User.create(validProps());
      user.updateUser({ name: 'Jane Doe' });
      expect(user.name).toBe('Jane Doe');
    });

    it('changes email', () => {
      const user = User.create(validProps());
      user.updateUser({ email: 'jane@studio.com' });
      expect(user.email).toBe('jane@studio.com');
    });

    it('throws when new email is invalid', () => {
      const user = User.create(validProps());
      expect(() => user.updateUser({ email: 'bad' })).toThrow(
        EntityValidationError,
      );
    });
  });

  describe('changePassword', () => {
    it('replaces the hashed password', () => {
      const user = User.create(validProps());
      user.changePassword('new_hashed_password');
      expect(user.password).toBe('new_hashed_password');
    });
  });

  describe('toJSON', () => {
    it('omits the password field', () => {
      const user = User.create(validProps());
      const json = user.toJSON();
      expect(json).not.toHaveProperty('password');
      expect(json).toMatchObject({
        email: 'john@studio.com',
        name: 'John Doe',
        active: true,
      });
    });
  });
});
