import UpdateUseCase from '../../../usecase/update/update.usecase';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Organization } from '../../../domain/organization.entity';

const validOrganization = () =>
  Organization.create({ name: 'CD Projekt', slug: 'cd-projekt' });

const makeSut = (
  organization: Organization | null = null,
  existingBySlug: Organization | null = null,
) => {
  const organizationGateway = {
    findBySlug: jest.fn().mockResolvedValue(existingBySlug),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(organization),
  };
  const useCase = new UpdateUseCase(
    organizationGateway as any,
    findByIdUseCase as any,
  );
  return { useCase, organizationGateway, findByIdUseCase };
};

describe('UpdateOrganizationUseCase', () => {
  it('updates an organization name successfully', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway } = makeSut(organization);

    await useCase.execute({ id: organization.id, name: 'CD Projekt Red' });

    expect(organizationGateway.update).toHaveBeenCalledTimes(1);
    expect(organization.name).toBe('CD Projekt Red');
  });

  it('checks slug uniqueness when slug is changed', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway } = makeSut(organization, null);

    await useCase.execute({ id: organization.id, slug: 'new-slug' });

    expect(organizationGateway.findBySlug).toHaveBeenCalledWith('new-slug');
    expect(organizationGateway.update).toHaveBeenCalledTimes(1);
  });

  it('throws EntityValidationError when new slug is already taken', async () => {
    const organization = validOrganization();
    const otherOrg = Organization.create({
      name: 'Other Studio',
      slug: 'other-studio',
    });
    const { useCase } = makeSut(organization, otherOrg);

    await expect(
      useCase.execute({ id: organization.id, slug: 'other-studio' }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });

  it('does not check slug when slug is unchanged', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway } = makeSut(organization);

    await useCase.execute({ id: organization.id, name: 'CD Projekt Red' });

    expect(organizationGateway.findBySlug).not.toHaveBeenCalled();
  });

  it('throws NotFoundError propagated from findByIdUseCase', async () => {
    const { useCase, findByIdUseCase } = makeSut(null);
    findByIdUseCase.execute.mockRejectedValue(
      new NotFoundError('id', Organization),
    );

    await expect(
      useCase.execute({ id: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
