import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import { Organization } from '../../../domain/organization.entity';

const validOrganization = () =>
  Organization.create({ name: 'CD Projekt', slug: 'cd-projekt' });

const makeSut = (organization: Organization | null = null) => {
  const organizationGateway = {
    findById: jest.fn().mockResolvedValue(organization),
  };
  const useCase = new FindByIdUseCase(organizationGateway as any);
  return { useCase, organizationGateway };
};

describe('FindByIdOrganizationUseCase', () => {
  it('returns the organization when found', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway } = makeSut(organization);

    const result = await useCase.execute({ id: organization.id });

    expect(organizationGateway.findById).toHaveBeenCalledWith(organization.id);
    expect(result).toBe(organization);
  });

  it('throws NotFoundError when organization does not exist', async () => {
    const { useCase } = makeSut(null);

    await expect(
      useCase.execute({ id: '00000000-0000-4000-8000-000000000000' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
