import MissionValidatorFactory from '../../../domain/validators/mission.validator';
import { Mission } from '../../../domain/mission.entity';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';

const validOrgId = '11111111-1111-4111-8111-111111111111';
const validWorkspaceId = '33333333-3333-4333-8333-333333333333';
const validAuthorId = '22222222-2222-4222-8222-222222222222';

const buildMission = (
  overrides: Partial<{
    id: string;
    name: string;
    organizationId: string;
    workspaceId: string;
    authorId: string;
  }> = {},
): Mission =>
  new Mission({
    id: 'qst_valid',
    name: 'Valid Name',
    organizationId: validOrgId,
    workspaceId: validWorkspaceId,
    authorId: validAuthorId,
    ...overrides,
  });

describe('MissionValidator', () => {
  const validator = MissionValidatorFactory.create();

  it('returns true for a valid mission', () => {
    const notification = new Notification();
    const ok = validator.validate(notification, buildMission(), ['create']);
    expect(ok).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  it('collects error when id is not snake_case', () => {
    const notification = new Notification();
    validator.validate(notification, buildMission({ id: 'InvalidID' }), [
      'create',
    ]);
    expect(notification.hasErrors()).toBe(true);
  });

  it('collects error when name is too short', () => {
    const notification = new Notification();
    validator.validate(notification, buildMission({ name: 'x' }), ['create']);
    expect(notification.toJSON()).toEqual(
      expect.arrayContaining([{ field: 'name', message: 'Invalid name' }]),
    );
  });

  it('collects error when organizationId is not a UUID', () => {
    const notification = new Notification();
    validator.validate(
      notification,
      buildMission({ organizationId: 'abc' }),
      ['create'],
    );
    expect(notification.toJSON()).toEqual(
      expect.arrayContaining([
        { field: 'organizationId', message: 'Invalid organization' },
      ]),
    );
  });

  it('defaults to the "create" group when fields is empty', () => {
    const notification = new Notification();
    validator.validate(notification, buildMission({ name: 'x' }), []);
    expect(notification.hasErrors()).toBe(true);
  });

  it('does not validate id/organizationId/authorId on "update" group', () => {
    const notification = new Notification();
    validator.validate(
      notification,
      buildMission({
        id: 'InvalidID',
        organizationId: 'abc',
        authorId: 'abc',
      }),
      ['update'],
    );
    expect(notification.hasErrors()).toBe(false);
  });
});
