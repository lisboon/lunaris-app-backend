import { Member } from '../../domain/member.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { MemberRole } from '@/modules/@shared/domain/enums';

const validProps = () => ({
  userId: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
});

describe('Member', () => {
  describe('create', () => {
    it('builds a valid member with defaults', () => {
      const member = Member.create(validProps());
      expect(member.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(member.userId).toBe(validProps().userId);
      expect(member.organizationId).toBe(validProps().organizationId);
      expect(member.role).toBe(MemberRole.DESIGNER);
      expect(member.active).toBe(true);
      expect(member.createdAt).toBeInstanceOf(Date);
    });

    it('defaults role to DESIGNER', () => {
      const member = Member.create(validProps());
      expect(member.role).toBe(MemberRole.DESIGNER);
    });

    it('throws EntityValidationError when userId is not a valid UUID', () => {
      expect(() =>
        Member.create({ ...validProps(), userId: 'not-a-uuid' }),
      ).toThrow(EntityValidationError);
    });

    it('throws EntityValidationError when organizationId is not a valid UUID', () => {
      expect(() =>
        Member.create({ ...validProps(), organizationId: 'not-a-uuid' }),
      ).toThrow(EntityValidationError);
    });
  });

  describe('changeRole', () => {
    it('updates the role', () => {
      const member = Member.create(validProps());
      member.changeRole(MemberRole.ADMIN);
      expect(member.role).toBe(MemberRole.ADMIN);
    });
  });

  describe('toJSON', () => {
    it('returns all fields', () => {
      const member = Member.create(validProps());
      expect(member.toJSON()).toMatchObject({
        id: member.id,
        userId: validProps().userId,
        organizationId: validProps().organizationId,
        role: MemberRole.DESIGNER,
        active: true,
      });
    });
  });
});
