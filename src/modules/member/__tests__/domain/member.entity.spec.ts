import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MemberRole } from '@/modules/@shared/domain/enums';
import { Member } from '../../domain/member.entity';

const userId = '11111111-1111-4111-8111-111111111111';
const orgId = '22222222-2222-4222-8222-222222222222';

const validProps = () => ({
  userId,
  organizationId: orgId,
  role: MemberRole.ADMIN,
});

describe('Member', () => {
  describe('create', () => {
    it('builds a valid member with defaults', () => {
      const member = Member.create(validProps());
      expect(member.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(member.userId).toBe(userId);
      expect(member.organizationId).toBe(orgId);
      expect(member.role).toBe(MemberRole.ADMIN);
      expect(member.active).toBe(true);
    });

    it('defaults role to DESIGNER when not provided', () => {
      const member = Member.create({
        userId,
        organizationId: orgId,
      });
      expect(member.role).toBe(MemberRole.DESIGNER);
    });

    it('throws when userId is not a valid UUID', () => {
      expect(() =>
        Member.create({ ...validProps(), userId: 'bad' }),
      ).toThrow(EntityValidationError);
    });

    it('throws when organizationId is not a valid UUID', () => {
      expect(() =>
        Member.create({ ...validProps(), organizationId: 'bad' }),
      ).toThrow(EntityValidationError);
    });
  });

  describe('changeRole', () => {
    it('updates the role', () => {
      const member = Member.create(validProps());
      member.changeRole(MemberRole.VIEWER);
      expect(member.role).toBe(MemberRole.VIEWER);
    });
  });

  describe('toJSON', () => {
    it('returns all fields', () => {
      const member = Member.create(validProps());
      expect(member.toJSON()).toMatchObject({
        userId,
        organizationId: orgId,
        role: MemberRole.ADMIN,
        active: true,
      });
    });
  });
});