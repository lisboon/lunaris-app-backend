---
paths:
  - "src/infra/http/**/*.ts"
---

# Infrastructure HTTP Layer — Regras

## NestJS Module

```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    { provide: UserFacade, useFactory: () => UserFacadeFactory.create() },
  ],
})
export class UserModule {}
```

## Service (Thin Adapter)

```typescript
@Injectable()
export class UserService {
  constructor(private readonly facade: UserFacade) {}
  async create(input: CreateUserInputDto) { return this.facade.create(input); }
}
```

## Controller

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Role({ context: 'USER', level: 1, minAdmin: 3 })
  async create(@Body() body: CreateUserInput, @Req() req: any) {
    return this.service.create(body);
  }

  @Get('search')
  @UseGuards(AuthGuard, RolesGuard)
  @Role({ context: 'USER', level: 1 })
  async search(@Query() query: SearchUserInput, @Req() req: any) {
    return this.service.search({ ...query, companyId: req.user.companyId });
  }
}
```

## Available Guards

| Guard | Purpose |
|-------|-----|
| `AuthGuard` | Verifies JWT Bearer token |
| `RolesGuard` | Checks `@Role({context, level, minAdmin})` |
| `APIGuard` | Public API `/v1/api/*` — verifies JWT API key |
| `SystemGuard` | System endpoints |
| `ShareGuard` | Validates share token |
| `CloudflareGuard` | Validates Turnstile CAPTCHA |
| `SignatureVerificationGuard` | HMAC-SHA256 for webhooks |

## Exception Filters

- Global in `src/infra/http/shared/errors/`
- Automatically map domain errors to HTTP status codes
- Exception Factory: `src/infra/http/shared/errors/exception-factory.ts`