import DeleteUseCase from '../../../usecase/delete/delete.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Organization } from '../../../domain/organization.entity';

const validOrganization = () =>
  Organization.create({ name: 'CD Projekt', slug: 'cd-projekt' });

const makeSut = (organization: Organization | null = null) => {
  const organizationGateway = {
    update: jest.fn().mockResolvedValue(undefined),
  };
  const findByIdUseCase = {
    execute: jest.fn().mockResolvedValue(organization),
  };
  const useCase = new DeleteUseCase(
    organizationGateway as any,
    findByIdUseCase as any,
  );
  return { useCase, organizationGateway, findByIdUseCase };
};

describe('DeleteOrganizationUseCase', () => {
  it('soft-deletes the organization', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway } = makeSut(organization);

    await useCase.execute({ id: organization.id });

    expect(organizationGateway.update).toHaveBeenCalledTimes(1);
    expect(organization.deletedAt).toBeDefined();
    expect(organization.active).toBe(false);
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
