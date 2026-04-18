import { UserGateway } from '../../gateway/user.gateway';
import { User } from '../../domain/user.entity';
import { NotFoundError } from '@/modules/@shared/domain/errors/not-found.error';
import {
  FindByIdUseCaseInputDto,
  FindByIdUseCaseInterface,
} from './find-by-id.usecase.dto';

export default class FindByIdUseCase implements FindByIdUseCaseInterface {
  constructor(private readonly userRepository: UserGateway) {}

  async execute(data: FindByIdUseCaseInputDto): Promise<User> {
    const user = await this.userRepository.findById(data.id);

    if (!user) {
      throw new NotFoundError(data.id, User);
    }

    return user;
  }
}