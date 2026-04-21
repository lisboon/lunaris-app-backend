import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionModule } from './mission/mission.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { EngineModule } from './engine/engine.module';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { MemberModule } from './member/member.module';
import { InviteModule } from './invite/invite.module';
import { EngineThrottlerGuard } from './shared/throttler/engine-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: Number(process.env.THROTTLE_LIMIT ?? 30),
        },
        {
          name: 'engine',
          ttl: Number(process.env.ENGINE_THROTTLE_WINDOW_MS ?? 60_000),
          limit: Number(process.env.ENGINE_THROTTLE_LIMIT ?? 600),
        },
      ],
    }),
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
    { provide: APP_GUARD, useClass: EngineThrottlerGuard },
  ],
})
export class AppModule {}
