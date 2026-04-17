import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { ForbiddenError } from '@/modules/@shared/domain/errors/forbidden.error';
import { MemberRole, InviteStatus } from '@/modules/@shared/domain/enums';
import { Invite } from '../../domain/invite.entity';

const orgId = '11111111-1111-4111-8111-111111111111';
const invitedById = '22222222-2222-4222-8222-222222222222';

const validProps = () => ({
  email: 'invitee@studio.com',
  role: MemberRole.DESIGNER,
  organizationId: orgId,
  invitedById,
  token: 'unique-token-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

describe('Invite', () => {
  describe('create', () => {
    it('builds a valid invite with PENDING status', () => {
      const invite = Invite.create(validProps());
      expect(invite.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(invite.email).toBe('invitee@studio.com');
      expect(invite.role).toBe(MemberRole.DESIGNER);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.token).toBe('unique-token-123');
      expect(invite.organizationId).toBe(orgId);
      expect(invite.invitedById).toBe(invitedById);
      expect(invite.expiresAt).toBeInstanceOf(Date);
    });

    it('throws when email is invalid', () => {
      expect(() =>
        Invite.create({ ...validProps(), email: 'not-email' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when organizationId is not a UUID', () => {
      expect(() =>
        Invite.create({ ...validProps(), organizationId: 'bad' }),
      ).toThrow(EntityValidationError);
    });
  });

  describe('accept', () => {
    it('sets status to ACCEPTED', () => {
      const invite = Invite.create(validProps());
      invite.accept();
      expect(invite.status).toBe(InviteStatus.ACCEPTED);
    });

    it('throws when already accepted', () => {
      const invite = Invite.create(validProps());
      invite.accept();
      expect(() => invite.accept()).toThrow(ForbiddenError);
    });

    it('throws when expired', () => {
      const invite = Invite.create({
        ...validProps(),
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(() => invite.accept()).toThrow(ForbiddenError);
    });
  });

  describe('cancel', () => {
    it('sets status to CANCELLED', () => {
      const invite = Invite.create(validProps());
      invite.cancel();
      expect(invite.status).toBe(InviteStatus.CANCELLED);
    });

    it('throws when not PENDING', () => {
      const invite = Invite.create(validProps());
      invite.accept();
      expect(() => invite.cancel()).toThrow(ForbiddenError);
    });
  });

  describe('isExpired', () => {
    it('returns false when not expired', () => {
      const invite = Invite.create(validProps());
      expect(invite.isExpired()).toBe(false);
    });

    it('returns true when past expiresAt', () => {
      const invite = Invite.create({
        ...validProps(),
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(invite.isExpired()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('returns all fields', () => {
      const invite = Invite.create(validProps());
      const json = invite.toJSON();
      expect(json).toMatchObject({
        email: 'invitee@studio.com',
        role: MemberRole.DESIGNER,
        status: InviteStatus.PENDING,
        organizationId: orgId,
        invitedById,
      });
    });
  });
});