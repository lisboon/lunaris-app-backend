import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import OrganizationFacade from '@/modules/organization/facade/organization.facade';
import OrganizationFacadeFactory from '@/modules/organization/factory/facade.factory';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: OrganizationFacade,
      useFactory: () => OrganizationFacadeFactory.create(),
    },
  ],
  exports: [OrganizationService, OrganizationFacade],
})
export class OrganizationModule {}
