import BaseUseCase from '@/modules/@shared/usecase/base.usecase';

export interface SearchUseCaseInputDto {
  organizationId: string;
}

export interface SearchItemDto {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface SearchUseCaseOutputDto {
  items: SearchItemDto[];
  total: number;
}

export interface SearchUseCaseInterface
  extends BaseUseCase<SearchUseCaseInputDto, SearchUseCaseOutputDto> {
  execute(input: SearchUseCaseInputDto): Promise<SearchUseCaseOutputDto>;
}
