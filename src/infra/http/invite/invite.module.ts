import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import InviteFacade from '@/modules/invite/facade/invite.facade';
import InviteFacadeFactory from '@/modules/invite/factory/facade.factory';

@Module({
  imports: [AuthModule],
  controllers: [InviteController],
  providers: [
    InviteService,
    {
      provide: InviteFacade,
      useFactory: () => InviteFacadeFactory.create(),
    },
  ],
  exports: [InviteService, InviteFacade],
})
export class InviteModule {}
