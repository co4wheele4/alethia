import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>["compile"]>> = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get<AppController>(AppController);
    service = moduleRef.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(controller.getHello()).toBe('Hello World!');
    });

    it('should call AppService.getHello', () => {
      const getHelloSpy = jest.spyOn(service, 'getHello');
      controller.getHello();
      expect(getHelloSpy).toHaveBeenCalled();
    });
  });
});
