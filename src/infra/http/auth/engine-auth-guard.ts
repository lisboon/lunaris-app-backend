import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import ApiKeyFacade from '@/modules/engine/facade/engine.facade';
import { UnauthorizedError } from '@/modules/@shared/domain/errors/unauthorized.error';

export interface EngineAuthPayload {
  organizationId: string;
  apiKeyId: string;
}

@Injectable()
export class EngineAuthGuard implements CanActivate {
  constructor(private readonly apiKeyFacade: ApiKeyFacade) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedError('Engine API Key not provided');
    }

    const result = await this.apiKeyFacade.validateKey({ rawKey });
    request['engine'] = {
      organizationId: result.organizationId,
      apiKeyId: result.id,
    } satisfies EngineAuthPayload;
    return true;
  }
}
