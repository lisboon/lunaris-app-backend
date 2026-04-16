import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import MissionFacadeFactory from '@/modules/mission/factory/facade.factory';
import MissionFacade from '@/modules/mission/facade/mission.facade';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';

@Module({
  imports: [AuthModule],
  controllers: [MissionController],
  providers: [
    MissionService,
    {
      provide: MissionFacade,
      useFactory: () => MissionFacadeFactory.create(),
    },
  ],
  exports: [MissionService, MissionFacade],
})
export class MissionModule {}
