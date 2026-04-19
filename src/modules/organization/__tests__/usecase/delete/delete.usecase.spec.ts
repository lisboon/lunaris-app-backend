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
  const apiKeyGateway = {
    revokeByOrganization: jest.fn().mockResolvedValue(undefined),
  };
  const transactionManager = {
    execute: jest.fn().mockImplementation(async (fn: any) => fn({ trx: true })),
  };
  const useCase = new DeleteUseCase(
    organizationGateway as any,
    findByIdUseCase as any,
    memberGateway as any,
    inviteGateway as any,
    apiKeyGateway as any,
    transactionManager as any,
  );
  return {
    useCase,
    organizationGateway,
    findByIdUseCase,
    memberGateway,
    inviteGateway,
    apiKeyGateway,
    transactionManager,
  };
};

describe('DeleteOrganizationUseCase', () => {
  it('soft-deletes the organization and cascades to members, pending invites and api keys', async () => {
    const organization = validOrganization();
    const {
      useCase,
      organizationGateway,
      memberGateway,
      inviteGateway,
      apiKeyGateway,
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
    expect(apiKeyGateway.revokeByOrganization).toHaveBeenCalledWith(
      organization.id,
      expect.objectContaining({ trx: true }),
    );
    expect(organization.deletedAt).toBeDefined();
    expect(organization.active).toBe(false);
  });

  it('revokes api keys inside the same transaction as the org soft-delete', async () => {
    const organization = validOrganization();
    const { useCase, organizationGateway, apiKeyGateway } = makeSut(organization);

    await useCase.execute({ id: organization.id });

    const orgUpdateOrder = organizationGateway.update.mock.invocationCallOrder[0];
    const apiKeyRevokeOrder =
      apiKeyGateway.revokeByOrganization.mock.invocationCallOrder[0];
    expect(apiKeyRevokeOrder).toBeGreaterThan(orgUpdateOrder);
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
