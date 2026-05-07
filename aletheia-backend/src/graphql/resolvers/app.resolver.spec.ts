import { Test } from '@nestjs/testing';
import { AppResolver } from './app.resolver';

describe('AppResolver', () => {
  let resolver: AppResolver;

  beforeEach(async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [AppResolver],
    }).compile();

    resolver = moduleRef.get<AppResolver>(AppResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('hello', () => {
    it('should return "Hello, Aletheia!"', () => {
      const result = resolver.hello();
      expect(result).toBe('Hello, Aletheia!');
    });
  });
});
