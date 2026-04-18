import { FindByIdUseCaseInterface } from '../usecase/find-by-id/find-by-id.usecase.dto';
import { RegisterUseCaseInterface } from '../usecase/register/register.usecase.dto';
import { LoginUseCaseInterface } from '../usecase/login/login.usecase.dto';
import {
  UserFacadeInterface,
  RegisterFacadeInputDto,
  RegisterFacadeOutputDto,
  LoginFacadeInputDto,
  LoginFacadeOutputDto,
  FindByIdFacadeInputDto,
  FindByIdFacadeOutputDto,
} from './user.facade.dto';

export default class UserFacade implements UserFacadeInterface {
  constructor(
    private readonly findByIdUseCase: FindByIdUseCaseInterface,
    private readonly registerUseCase: RegisterUseCaseInterface,
    private readonly loginUseCase: LoginUseCaseInterface,
  ) {}

  async register(data: RegisterFacadeInputDto): Promise<RegisterFacadeOutputDto> {
    return this.registerUseCase.execute(data);
  }

  async login(data: LoginFacadeInputDto): Promise<LoginFacadeOutputDto> {
    return this.loginUseCase.execute(data);
  }

  async findById(data: FindByIdFacadeInputDto): Promise<FindByIdFacadeOutputDto> {
    const user = await this.findByIdUseCase.execute(data);
    return user.toJSON();
  }
}
