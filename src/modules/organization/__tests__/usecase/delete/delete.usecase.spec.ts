import DeleteUseCase from '../../../usecase/delete/delete.usecase';
import { Organization } from '../../../domain/organization.entity';

const makeSut = () => {
  const org = Organization.create({ name: 'CD Projekt Red', slug: 'cd-projekt-red' });
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(org) };
  const repository = { update: jest.fn().mockResolvedValue(undefined) };
  const useCase = new DeleteUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, org };
};

describe('DeleteUseCase (Organization)', () => {
  it('soft-deletes the organization', async () => {
    const { useCase, repository, org } = makeSut();
    await useCase.execute({ id: org.id });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });
});