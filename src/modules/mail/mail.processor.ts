import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService, SendTemplateOptions } from './mail.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send')
  async handleSendMail(job: Job<SendTemplateOptions>): Promise<void> {
    try {
      this.logger.log(`Processing mail job ${job.id} to ${job.data.to}`);
      await this.mailService.sendTemplate(job.data);
      this.logger.log(`Mail job ${job.id} completed`);
    } catch (error) {
      this.logger.error(
        `Mail job ${job.id} failed`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
