import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import WorkspaceFacade from '@/modules/workspace/facade/workspace.facade';
import WorkspaceFacadeFactory from '@/modules/workspace/factory/facade.factory';

@Module({
  imports: [AuthModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    {
      provide: WorkspaceFacade,
      useFactory: () => WorkspaceFacadeFactory.create(),
    },
  ],
  exports: [WorkspaceService, WorkspaceFacade],
})
export class WorkspaceModule {}
