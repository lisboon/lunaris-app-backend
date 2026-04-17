import { Mission } from '../../domain/mission.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MissionCreatedEvent } from '../../event/mission-created.event';
import { MissionPublishedEvent } from '../../event/mission-published.event';
import { MissionStatus } from '@/modules/@shared/domain/enums/mission-status.enum';

const validProps = () => ({
  id: 'qst_old_country',
  name: 'The Old Country',
  organizationId: '11111111-1111-4111-8111-111111111111',
  workspaceId: '33333333-3333-4333-8333-333333333333',
  authorId: '22222222-2222-4222-8222-222222222222',
});

describe('Mission', () => {
  describe('create', () => {
    it('builds a valid mission with default DRAFT status', () => {
      const m = Mission.create(validProps());
      expect(m.id).toBe('qst_old_country');
      expect(m.name).toBe('The Old Country');
      expect(m.status).toBe(MissionStatus.DRAFT);
      expect(m.activeHash).toBeUndefined();
      expect(m.active).toBe(true);
    });

    it('queues a MissionCreatedEvent', () => {
      const m = Mission.create(validProps());
      const events = m.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MissionCreatedEvent);
    });

    it('throws when id is not snake_case', () => {
      expect(() =>
        Mission.create({ ...validProps(), id: 'InvalidID' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when name is too short', () => {
      expect(() => Mission.create({ ...validProps(), name: 'x' })).toThrow(
        EntityValidationError,
      );
    });
  });

  describe('updateMission', () => {
    it('changes name + description and refreshes updatedAt', async () => {
      const m = Mission.create(validProps());
      const before = m.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 2));
      m.updateMission({ name: 'New Name', description: 'desc' });
      expect(m.name).toBe('New Name');
      expect(m.description).toBe('desc');
      expect(m.updatedAt.getTime()).toBeGreaterThan(before);
    });

    it('throws when the new name is invalid', () => {
      const m = Mission.create(validProps());
      expect(() => m.updateMission({ name: 'x' })).toThrow(
        EntityValidationError,
      );
    });

    it('keeps the current name when name is not provided', () => {
      const m = Mission.create(validProps());
      m.updateMission({ description: 'only desc' });
      expect(m.name).toBe('The Old Country');
      expect(m.description).toBe('only desc');
    });
  });

  describe('publish', () => {
    it('sets activeHash + APPROVED status and queues MissionPublishedEvent', () => {
      const m = Mission.create(validProps());
      m.pullEvents(); // drain create event

      m.publish('a'.repeat(64));

      expect(m.activeHash).toBe('a'.repeat(64));
      expect(m.status).toBe(MissionStatus.APPROVED);
      const events = m.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MissionPublishedEvent);
    });
  });

  describe('delete (soft)', () => {
    it('sets deletedAt and deactivates', () => {
      const m = Mission.create(validProps());
      m.delete();
      expect(m.active).toBe(false);
      expect(m.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('events', () => {
    it('pullEvents empties the buffer', () => {
      const m = Mission.create(validProps());
      expect(m.hasPendingEvents()).toBe(true);
      m.pullEvents();
      expect(m.hasPendingEvents()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns all fields with null for missing optionals', () => {
      const m = Mission.create(validProps());
      expect(m.toJSON()).toMatchObject({
        id: 'qst_old_country',
        name: 'The Old Country',
        description: null,
        status: MissionStatus.DRAFT,
        activeHash: null,
        organizationId: validProps().organizationId,
        authorId: validProps().authorId,
        active: true,
      });
    });
  });
});
