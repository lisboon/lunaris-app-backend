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
  const memberGateway = {
    softDeleteByOrganization: jest.fn().mockResolvedValue(undefined),
  };
  const inviteGateway = {
    cancelPendingByOrganization: jest.fn().mockResolvedValue(undefined),
  };
  const transactionManager = {
    execute: jest.fn().mockImplementation(async (fn: any) => fn({ trx: true })),
  };
  const useCase = new DeleteUseCase(
    organizationGateway as any,
    findByIdUseCase as any,
    memberGateway as any,
    inviteGateway as any,
    transactionManager as any,
  );
  return {
    useCase,
    organizationGateway,
    findByIdUseCase,
    memberGateway,
    inviteGateway,
    transactionManager,
  };
};

describe('DeleteOrganizationUseCase', () => {
  it('soft-deletes the organization and cascades to members and pending invites', async () => {
    const organization = validOrganization();
    const {
      useCase,
      organizationGateway,
      memberGateway,
      inviteGateway,
      transactionManager,
    } = makeSut(organization);

    await useCase.execute({ id: organization.id });

    expect(transactionManager.execute).toHaveBeenCalledTimes(1);
    expect(organizationGateway.update).toHaveBeenCalledWith(
      organization,
      expect.objectContaining({ trx: true }),
    );
    expect(memberGateway.softDeleteByOrganization).toHaveBeenCalledWith(
      organization.id,
      expect.objectContaining({ trx: true }),
    );
    expect(inviteGateway.cancelPendingByOrganization).toHaveBeenCalledWith(
      organization.id,
      expect.objectContaining({ trx: true }),
    );
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
