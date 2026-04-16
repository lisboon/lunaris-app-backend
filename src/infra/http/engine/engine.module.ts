import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MissionModule } from '../mission/mission.module';
import { EngineController } from './engine.controller';
import { EngineApiKeysController } from './engine-api-keys.controller';
import { EngineApiKeysService } from './engine-api-keys.service';

@Module({
  imports: [AuthModule, MissionModule],
  controllers: [EngineController, EngineApiKeysController],
  providers: [EngineApiKeysService],
})
export class EngineModule {}
