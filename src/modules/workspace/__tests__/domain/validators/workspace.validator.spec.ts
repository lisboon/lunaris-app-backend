import WorkspaceValidatorFactory from '../../../domain/validators/workspace.validator';
import { Workspace } from '../../../domain/workspace.entity';
import { Notification } from '@/modules/@shared/domain/entity/validators/notification';

const validOrgId = '11111111-1111-4111-8111-111111111111';

const buildWorkspace = (overrides: Partial<Workspace> = {}): Workspace => {
  return new Workspace({
    name: 'Valid Name',
    organizationId: validOrgId,
    ...overrides,
  });
};

describe('WorkspaceValidator', () => {
  const validator = WorkspaceValidatorFactory.create();

  it('returns true for a valid workspace', () => {
    const notification = new Notification();
    const ok = validator.validate(notification, buildWorkspace(), ['create']);
    expect(ok).toBe(true);
    expect(notification.hasErrors()).toBe(false);
  });

  it('collects error when name is too short', () => {
    const notification = new Notification();
    validator.validate(notification, buildWorkspace({ name: 'x' } as any), [
      'create',
    ]);
    expect(notification.hasErrors()).toBe(true);
    const errors = notification.toJSON();
    expect(errors).toEqual(
      expect.arrayContaining([{ field: 'name', message: 'Invalid name' }]),
    );
  });

  it('collects error when organizationId is not a UUID', () => {
    const notification = new Notification();
    validator.validate(
      notification,
      buildWorkspace({ organizationId: 'abc' } as any),
      ['create'],
    );
    const errors = notification.toJSON();
    expect(errors).toEqual(
      expect.arrayContaining([
        { field: 'organizationId', message: 'Invalid organization' },
      ]),
    );
  });

  it('defaults to the "create" group when fields is empty', () => {
    const notification = new Notification();
    validator.validate(notification, buildWorkspace({ name: 'x' } as any), []);
    expect(notification.hasErrors()).toBe(true);
  });
});
