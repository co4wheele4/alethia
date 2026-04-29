import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({
    description:
      'GraphQL HTTP path (use POST for queries; GET serves Playground in non-production when enabled)',
  })
  graphqlPath!: string;

  @ApiProperty({ description: 'This OpenAPI / Swagger document base path' })
  openApiPath!: string;
}
