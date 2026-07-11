import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { SendTemplateOptions } from './mail.service';

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}

  async enqueueTemplate(options: SendTemplateOptions): Promise<void> {
    await this.mailQueue.add('send', options, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
