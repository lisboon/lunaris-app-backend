import { Invite } from '../../domain/invite.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole, InviteStatus } from '@/modules/@shared/domain/enums';
import { InviteCreatedEvent } from '../../event/invite-created.event';
import { InviteAcceptedEvent } from '../../event/invite-accepted.event';
import { InviteResentEvent } from '../../event/invite-resent.event';

const futureDate = () => new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h from now
const pastDate = () => new Date(Date.now() - 1000 * 60 * 60 * 24); // 24h ago
const USER_ID = '33333333-3333-4333-8333-333333333333';

const validProps = () => ({
  email: 'geralt@rivia.com',
  role: MemberRole.DESIGNER,
  token: 'secure-random-token-abc123',
  organizationId: '11111111-1111-4111-8111-111111111111',
  invitedById: '22222222-2222-4222-8222-222222222222',
  expiresAt: futureDate(),
});

describe('Invite', () => {
  describe('create', () => {
    it('creates a valid invite with PENDING status', () => {
      const invite = Invite.create(validProps());
      expect(invite.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(invite.email).toBe('geralt@rivia.com');
      expect(invite.role).toBe(MemberRole.DESIGNER);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.createdAt).toBeInstanceOf(Date);
    });

    it('raises InviteCreatedEvent', () => {
      const invite = Invite.create(validProps());
      const events = invite.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InviteCreatedEvent);
    });

    it('throws EntityValidationError when email is invalid', () => {
      expect(() =>
        Invite.create({ ...validProps(), email: 'not-an-email' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when organizationId is not a valid UUID', () => {
      expect(() =>
        Invite.create({ ...validProps(), organizationId: 'not-a-uuid' }),
      ).toThrow(EntityValidationError);
    });

    it('normalizes email (trim + lowercase)', () => {
      const invite = Invite.create({
        ...validProps(),
        email: '  Geralt@Rivia.COM ',
      });
      expect(invite.email).toBe('geralt@rivia.com');
    });
  });

  describe('accept', () => {
    it('sets status to ACCEPTED', () => {
      const invite = Invite.create(validProps());
      invite.accept(USER_ID);
      expect(invite.status).toBe(InviteStatus.ACCEPTED);
    });

    it('raises InviteAcceptedEvent with userId', () => {
      const invite = Invite.create(validProps());
      invite.pullEvents(); // drop InviteCreatedEvent from create()
      invite.accept(USER_ID);
      const events = invite.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InviteAcceptedEvent);
      expect((events[0] as InviteAcceptedEvent).userId).toBe(USER_ID);
    });

    it('throws ForbiddenError if already accepted', () => {
      const invite = Invite.create(validProps());
      invite.accept(USER_ID);
      expect(() => invite.accept(USER_ID)).toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if invite is expired', () => {
      const invite = Invite.create({ ...validProps(), expiresAt: pastDate() });
      expect(() => invite.accept(USER_ID)).toThrow(ForbiddenError);
    });
  });

  describe('cancel', () => {
    it('sets status to CANCELLED', () => {
      const invite = Invite.create(validProps());
      invite.cancel();
      expect(invite.status).toBe(InviteStatus.CANCELLED);
    });

    it('throws ForbiddenError if invite is not PENDING', () => {
      const invite = Invite.create(validProps());
      invite.cancel();
      expect(() => invite.cancel()).toThrow(ForbiddenError);
    });
  });

  describe('renewToken', () => {
    it('updates token and expiry and raises InviteResentEvent', () => {
      const invite = Invite.create(validProps());
      invite.pullEvents();
      const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      invite.renewToken('new-token', newExpiry);
      expect(invite.token).toBe('new-token');
      expect(invite.expiresAt).toBe(newExpiry);
      const events = invite.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(InviteResentEvent);
    });

    it('throws ForbiddenError if invite is not PENDING', () => {
      const invite = Invite.create(validProps());
      invite.cancel();
      expect(() =>
        invite.renewToken('t', new Date(Date.now() + 10000)),
      ).toThrow();
    });
  });

  describe('isExpired', () => {
    it('returns false when invite has not expired', () => {
      const invite = Invite.create(validProps());
      expect(invite.isExpired()).toBe(false);
    });

    it('returns true when expiresAt is in the past', () => {
      const invite = Invite.create({ ...validProps(), expiresAt: pastDate() });
      expect(invite.isExpired()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('returns public fields only (no token, no active, no deletedAt)', () => {
      const invite = Invite.create(validProps());
      const json = invite.toJSON();
      expect(json).toMatchObject({
        id: invite.id,
        email: 'geralt@rivia.com',
        role: MemberRole.DESIGNER,
        status: InviteStatus.PENDING,
        organizationId: validProps().organizationId,
        invitedById: validProps().invitedById,
      });
      expect(json.expiresAt).toBeInstanceOf(Date);
      expect(json).not.toHaveProperty('token');
      expect(json).not.toHaveProperty('active');
      expect(json).not.toHaveProperty('deletedAt');
    });
  });
});
