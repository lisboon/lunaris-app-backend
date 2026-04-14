import { Workspace } from '../../domain/workspace.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const validProps = () => ({
  name: 'Cyberpunk Team',
  organizationId: '11111111-1111-4111-8111-111111111111',
});

describe('Workspace', () => {
  describe('create', () => {
    it('builds a valid workspace with defaults', () => {
      const w = Workspace.create(validProps());
      expect(w.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(w.name).toBe('Cyberpunk Team');
      expect(w.active).toBe(true);
      expect(w.createdAt).toBeInstanceOf(Date);
      expect(w.deletedAt).toBeUndefined();
    });

    it('throws EntityValidationError when name is too short', () => {
      expect(() =>
        Workspace.create({ ...validProps(), name: 'x' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when organizationId is not a UUID', () => {
      expect(() =>
        Workspace.create({ ...validProps(), organizationId: 'not-a-uuid' }),
      ).toThrow(EntityValidationError);
    });
  });

  describe('updateWorkspace', () => {
    it('changes name and refreshes updatedAt', async () => {
      const w = Workspace.create(validProps());
      const before = w.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 2));
      w.updateWorkspace({ name: 'New Name' });
      expect(w.name).toBe('New Name');
      expect(w.updatedAt.getTime()).toBeGreaterThan(before);
    });

    it('throws when the new name is invalid', () => {
      const w = Workspace.create(validProps());
      expect(() => w.updateWorkspace({ name: 'x' })).toThrow(
        EntityValidationError,
      );
    });

    it('keeps the current name when name is not provided', () => {
      const w = Workspace.create(validProps());
      w.updateWorkspace({});
      expect(w.name).toBe('Cyberpunk Team');
    });
  });

  describe('delete (soft)', () => {
    it('sets deletedAt and deactivates', () => {
      const w = Workspace.create(validProps());
      w.delete();
      expect(w.active).toBe(false);
      expect(w.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('events', () => {
    it('pullEvents empties the buffer', () => {
      const w = Workspace.create(validProps());
      // @ts-expect-error accessing protected for testing
      w.addEvent({ eventName: 'WorkspaceCreated', occurredOn: new Date() });
      expect(w.hasPendingEvents()).toBe(true);
      const events = w.pullEvents();
      expect(events).toHaveLength(1);
      expect(w.hasPendingEvents()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns all primitive fields', () => {
      const w = Workspace.create(validProps());
      expect(w.toJSON()).toMatchObject({
        id: w.id,
        name: 'Cyberpunk Team',
        organizationId: validProps().organizationId,
        active: true,
      });
    });
  });
});
