import OrganizationFacade from '../../facade/organization.facade';
import { Organization } from '../../domain/organization.entity';

const makeSut = () => {
  const organization = Organization.create({ name: 'Acme Studio', slug: 'acme-studio' });

  const findByIdUseCase = { execute: jest.fn().mockResolvedValue(organization) };
  const updateUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
  const deleteUseCase = { execute: jest.fn().mockResolvedValue(undefined) };

  const facade = new OrganizationFacade(
    findByIdUseCase as any,
    updateUseCase as any,
    deleteUseCase as any,
  );

  return { facade, organization, findByIdUseCase, updateUseCase, deleteUseCase };
};

describe('OrganizationFacade', () => {
  it('findById delegates to use case and serializes the entity via toJSON', async () => {
    const { facade, organization, findByIdUseCase } = makeSut();

    const output = await facade.findById({ id: organization.id });

    expect(findByIdUseCase.execute).toHaveBeenCalledWith({ id: organization.id });
    expect(output).toEqual(organization.toJSON());
    expect(output).not.toBe(organization);
  });

  it('update delegates to the update use case', async () => {
    const { facade, organization, updateUseCase } = makeSut();
    const input = { id: organization.id, name: 'New Name' };

    await facade.update(input);

    expect(updateUseCase.execute).toHaveBeenCalledWith(input);
  });

  it('delete delegates to the delete use case', async () => {
    const { facade, organization, deleteUseCase } = makeSut();
    const input = { id: organization.id };

    await facade.delete(input);

    expect(deleteUseCase.execute).toHaveBeenCalledWith(input);
  });
});
