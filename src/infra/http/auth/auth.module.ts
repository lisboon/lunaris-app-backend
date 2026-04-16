import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { AuthGuard } from './auth-guard';
import { RolesGuard } from './roles-guard';
import { EngineAuthGuard } from './engine-auth-guard';
import ApiKeyFacade from '@/modules/engine/facade/engine.facade';
import ApiKeyFacadeFactory from '@/modules/engine/factory/facade.factory';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET environment variable is not set.');
        }
        return process.env.JWT_SECRET;
      })(),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue,
      },
    }),
  ],
  providers: [
    AuthGuard,
    RolesGuard,
    EngineAuthGuard,
    {
      provide: ApiKeyFacade,
      useFactory: () => ApiKeyFacadeFactory.create(),
    },
  ],
  exports: [AuthGuard, RolesGuard, EngineAuthGuard, ApiKeyFacade],
})
export class AuthModule {}
