import UpdateUseCase from '../../../usecase/update/update.usecase';
import { Organization } from '../../../domain/organization.entity';
import { EntityValidationError } from '@/modules/@shared/domain/errors/validation.error';

const makeSut = () => {
  const org = Organization.create({ name: 'CD Projekt Red', slug: 'cd-projekt-red' });
  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(org) };
  const repository = {
    findBySlug: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new UpdateUseCase(repository as any, findByIdUseCase as any);
  return { useCase, repository, findByIdUseCase, org };
};

describe('UpdateUseCase (Organization)', () => {
  it('updates name successfully', async () => {
    const { useCase, repository, org } = makeSut();
    await useCase.execute({ id: org.id, name: 'Ubisoft' });
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('throws when new slug already taken', async () => {
    const { useCase, repository, org } = makeSut();
    repository.findBySlug.mockResolvedValue(Organization.create({ name: 'Other', slug: 'taken-slug' }));
    await expect(useCase.execute({ id: org.id, slug: 'taken-slug' })).rejects.toBeInstanceOf(EntityValidationError);
  });
});