import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import MemberFacade from '@/modules/member/facade/member.facade';
import MemberFacadeFactory from '@/modules/member/factory/facade.factory';

@Module({
  imports: [AuthModule],
  controllers: [MemberController],
  providers: [
    MemberService,
    {
      provide: MemberFacade,
      useFactory: () => MemberFacadeFactory.create(),
    },
  ],
  exports: [MemberService, MemberFacade],
})
export class MemberModule {}
