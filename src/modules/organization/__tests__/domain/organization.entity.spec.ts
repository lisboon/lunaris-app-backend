import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { Organization } from '../../domain/organization.entity';

const validProps = () => ({
  name: 'CD Projekt Red',
  slug: 'cd-projekt-red',
});

describe('Organization', () => {
  describe('create', () => {
    it('builds a valid organization with defaults', () => {
      const org = Organization.create(validProps());
      expect(org.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(org.name).toBe('CD Projekt Red');
      expect(org.slug).toBe('cd-projekt-red');
      expect(org.avatarUrl).toBeUndefined();
      expect(org.active).toBe(true);
      expect(org.createdAt).toBeInstanceOf(Date);
      expect(org.deletedAt).toBeUndefined();
    });

    it('throws when name is too short', () => {
      expect(() =>
        Organization.create({ ...validProps(), name: 'x' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when slug has uppercase', () => {
      expect(() =>
        Organization.create({ ...validProps(), slug: 'INVALID' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when slug has spaces', () => {
      expect(() =>
        Organization.create({ ...validProps(), slug: 'has space' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when slug is too short', () => {
      expect(() =>
        Organization.create({ ...validProps(), slug: 'ab' }),
      ).toThrow(EntityValidationError);
    });

    it('accepts slug with numbers and hyphens', () => {
      const org = Organization.create({ ...validProps(), slug: 'studio-42' });
      expect(org.slug).toBe('studio-42');
    });
  });

  describe('updateOrganization', () => {
    it('changes name and refreshes updatedAt', () => {
      const org = Organization.create(validProps());
      const before = org.updatedAt;
      org.updateOrganization({ name: 'Ubisoft' });
      expect(org.name).toBe('Ubisoft');
      expect(org.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('changes slug', () => {
      const org = Organization.create(validProps());
      org.updateOrganization({ slug: 'new-slug' });
      expect(org.slug).toBe('new-slug');
    });

    it('throws when new name is invalid', () => {
      const org = Organization.create(validProps());
      expect(() => org.updateOrganization({ name: 'x' })).toThrow(
        EntityValidationError,
      );
    });
  });

  describe('delete (soft)', () => {
    it('sets deletedAt and deactivates', () => {
      const org = Organization.create(validProps());
      org.delete();
      expect(org.active).toBe(false);
      expect(org.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('toJSON', () => {
    it('returns all fields', () => {
      const org = Organization.create(validProps());
      const json = org.toJSON();
      expect(json).toMatchObject({
        name: 'CD Projekt Red',
        slug: 'cd-projekt-red',
        avatarUrl: undefined,
        active: true,
      });
      expect(json.id).toBeDefined();
    });
  });
});