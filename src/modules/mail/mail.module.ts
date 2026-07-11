import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';
import { MailCronService } from './mail-cron.service';
import { MailQueueConsumer } from './mail-queue.consumer';

@Module({
  imports: [BullModule.registerQueue({ name: 'mail' })],
  providers: [
    MailService,
    MailQueueService,
    MailProcessor,
    MailCronService,
    MailQueueConsumer,
  ],
  controllers: [MailController],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
