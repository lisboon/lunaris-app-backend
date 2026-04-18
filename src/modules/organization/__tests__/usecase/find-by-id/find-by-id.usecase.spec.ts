import FindByIdUseCase from '../../../usecase/find-by-id/find-by-id.usecase';
import { Organization } from '../../../domain/organization.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';

const makeSut = () => {
  const org = Organization.create({ name: 'CD Projekt Red', slug: 'cd-projekt-red' });
  const repository = { findById: jest.fn().mockResolvedValue(org) };
  const useCase = new FindByIdUseCase(repository as any);
  return { useCase, repository, org };
};

describe('FindByIdUseCase (Organization)', () => {
  it('returns the organization when found', async () => {
    const { useCase, org } = makeSut();
    const result = await useCase.execute({ id: org.id });
    expect(result.slug).toBe('cd-projekt-red');
  });

  it('throws NotFoundError when not found', async () => {
    const { useCase, repository } = makeSut();
    repository.findById.mockResolvedValue(null);
    await expect(useCase.execute({ id: 'bad' })).rejects.toBeInstanceOf(NotFoundError);
  });
});