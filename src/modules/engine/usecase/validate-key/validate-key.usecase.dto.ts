import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface ValidateKeyUseCaseInputDto {
  rawKey: string;
}

export interface ValidateKeyUseCaseOutputDto {
  id: string;
  organizationId: string;
}

export interface ValidateKeyUseCaseInterface
  extends BaseUseCase<ValidateKeyUseCaseInputDto, ValidateKeyUseCaseOutputDto> {
  execute(
    input: ValidateKeyUseCaseInputDto,
  ): Promise<ValidateKeyUseCaseOutputDto>;
}
