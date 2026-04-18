import { Inject, Injectable } from '@nestjs/common';
import UserFacade from '@/modules/user/facade/user.facade';
import {
  RegisterFacadeInputDto,
  LoginFacadeInputDto,
  FindByIdFacadeInputDto,
} from '@/modules/user/facade/user.facade.dto';

@Injectable()
export class UserService {
  @Inject(UserFacade)
  private readonly userFacade: UserFacade;

  async register(input: RegisterFacadeInputDto) {
    return this.userFacade.register(input);
  }

  async login(input: LoginFacadeInputDto) {
    return this.userFacade.login(input);
  }

  async findById(input: FindByIdFacadeInputDto) {
    return this.userFacade.findById(input);
  }
}
