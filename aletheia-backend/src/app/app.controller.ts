import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root',
    description:
      'Minimal HTTP root. The application API is **GraphQL** at `POST /graphql`. Use OpenAPI (this document) for REST-only routes; see top-level description for GraphQL usage.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
