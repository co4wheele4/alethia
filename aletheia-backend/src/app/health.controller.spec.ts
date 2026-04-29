import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return ok, timestamp, and API paths', () => {
    const res = controller.getHealth();
    expect(res.status).toBe('ok');
    expect(res.graphqlPath).toBe('/graphql');
    expect(res.openApiPath).toBe('/api');
    expect(res.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
