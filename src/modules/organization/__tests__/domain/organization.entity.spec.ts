import { Organization } from '../../domain/organization.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const validProps = () => ({
  name: 'CD Projekt',
  slug: 'cd-projekt',
});

describe('Organization', () => {
  describe('create', () => {
    it('builds a valid organization with defaults', () => {
      const org = Organization.create(validProps());
      expect(org.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(org.name).toBe('CD Projekt');
      expect(org.slug).toBe('cd-projekt');
      expect(org.active).toBe(true);
      expect(org.createdAt).toBeInstanceOf(Date);
      expect(org.deletedAt).toBeUndefined();
    });

    it('throws EntityValidationError when name is too short', () => {
      expect(() =>
        Organization.create({ ...validProps(), name: 'x' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when slug has uppercase letters', () => {
      expect(() =>
        Organization.create({ ...validProps(), slug: 'CD-Projekt' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when slug has spaces', () => {
      expect(() =>
        Organization.create({ ...validProps(), slug: 'cd projekt' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when slug is too short', () => {
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
    it('changes name and refreshes updatedAt', async () => {
      const org = Organization.create(validProps());
      const before = org.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 2));
      org.updateOrganization({ name: 'Ubisoft' });
      expect(org.name).toBe('Ubisoft');
      expect(org.updatedAt.getTime()).toBeGreaterThan(before);
    });

    it('changes slug', () => {
      const org = Organization.create(validProps());
      org.updateOrganization({ slug: 'new-slug' });
      expect(org.slug).toBe('new-slug');
    });

    it('throws EntityValidationError when name is invalid', () => {
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
      expect(org.toJSON()).toMatchObject({
        id: org.id,
        name: 'CD Projekt',
        slug: 'cd-projekt',
        active: true,
      });
    });
  });
});
