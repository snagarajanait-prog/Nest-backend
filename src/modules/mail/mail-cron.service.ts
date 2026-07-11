import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailQueueService } from './mail-queue.service';
import { ConfigService } from '@nestjs/config';
import { APP } from '../../common/constants/app.constants';

@Injectable()
export class MailCronService {
  private readonly logger = new Logger(MailCronService.name);

  constructor(
    private readonly mailQueueService: MailQueueService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMail(): Promise<void> {
    const to = this.config.get<string>('mail.cronTo');
    if (!to) {
      this.logger.warn('Skipping cron mail: mail.cronTo is not configured');
      return;
    }

    const template =
      this.config.get<'welcome' | 'reset-password' | 'invoice'>(
        'mail.cronTemplate',
      ) ?? 'invoice';

    const name = this.config.get<string>('mail.cronName') ?? 'there';

    this.logger.log(`Enqueuing cron mail to ${to} using template ${template}`);
    await this.mailQueueService.enqueueTemplate({
      to,
      subject: `${APP.NAME} scheduled update`,
      template,
      context: {
        name,
        appName: APP.NAME,
        year: new Date().getFullYear(),
      },
      attachments: [
        {
          filename: `${template}-cron.txt`,
          content: `This message was delivered by a cron job from ${APP.NAME}.`,
        },
      ],
    });
  }
}
