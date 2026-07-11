import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { TestMailDto } from './dto/test-mail.dto';

const mockMailService = {
  sendTemplate: jest.fn(),
};

const mockMailQueueService = {
  enqueueTemplate: jest.fn(),
};

describe('MailController', () => {
  let controller: MailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        { provide: MailService, useValue: mockMailService },
        { provide: MailQueueService, useValue: mockMailQueueService },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send a test email', async () => {
    const dto: TestMailDto = {
      to: 'test@example.com',
      template: 'welcome',
      name: 'Jane',
    };

    mockMailService.sendTemplate.mockResolvedValue({
      messageId: 'id',
      previewUrl: false,
      transport: 'json',
    });

    const response = await controller.test(dto);

    expect(response).toEqual({
      success: true,
      message: 'Email sent successfully',
      data: { messageId: 'id', previewUrl: false, transport: 'json' },
    });
    expect(mockMailService.sendTemplate).toHaveBeenCalled();
  });

  it('should enqueue a mail job', async () => {
    const dto: TestMailDto = {
      to: 'test@example.com',
      template: 'invoice',
      name: 'Jane',
    };

    const response = await controller.queue(dto);

    expect(response).toEqual({
      success: true,
      message: 'Mail job enqueued successfully',
      data: { queued: true },
    });
    expect(mockMailQueueService.enqueueTemplate).toHaveBeenCalled();
  });
});
