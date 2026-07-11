import { Injectable, Logger } from '@nestjs/common';
import { OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';

@Injectable()
export class MailQueueConsumer {
  private readonly logger = new Logger(MailQueueConsumer.name);

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Mail queue active: ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Mail queue completed: ${job.id}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Mail queue failed: ${job.id}`, error.stack);
  }
}
