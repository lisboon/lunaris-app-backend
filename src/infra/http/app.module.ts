import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionModule } from './mission/mission.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { EngineModule } from './engine/engine.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { MemberModule } from './member/member.module';
import { InviteModule } from './invite/invite.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 30,
      },
    ]),
    MissionModule,
    EngineModule,
    WorkspaceModule,
    UserModule,
    OrganizationModule,
    MemberModule,
    InviteModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
