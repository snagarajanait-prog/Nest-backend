import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import type { MailTemplate } from './mail.service';
import { TestMailDto } from './dto/test-mail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { APP, MESSAGES, ROLES } from '../../common/constants/app.constants';

@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // POST /api/mail/test  (admin) — send any of the templates WITH an attachment.
  @Post('test')
  @Roles(ROLES.ADMIN)
  async test(@Body() dto: TestMailDto) {
    const template: MailTemplate = dto.template ?? 'welcome';
    const year = new Date().getFullYear();
    const name = dto.name ?? 'there';

    const subjects: Record<MailTemplate, string> = {
      welcome: MESSAGES.MAIL.WELCOME_SUBJECT,
      'reset-password': MESSAGES.MAIL.RESET_SUBJECT,
      invoice: MESSAGES.MAIL.INVOICE_SUBJECT,
    };

    const contexts: Record<MailTemplate, Record<string, unknown>> = {
      welcome: { name, appName: APP.NAME, year },
      'reset-password': {
        name,
        appName: APP.NAME,
        year,
        resetUrl: 'http://localhost:3000/reset?token=demo-token',
        expiresIn: '1 hour',
      },
      invoice: {
        customerName: name,
        appName: APP.NAME,
        year,
        invoiceNo: 'INV-1001',
        items: [
          { name: 'Wireless Mouse', qty: 1, price: 799.5 },
          { name: 'Keyboard', qty: 2, price: 999 },
        ],
        total: 2797.5,
      },
    };

    const result = await this.mailService.sendTemplate({
      to: dto.to,
      subject: subjects[template],
      template,
      context: contexts[template],
      attachments: [
        {
          filename: `${template}.txt`,
          content: `Sample "${template}" attachment from ${APP.NAME}.`,
        },
      ],
    });

    return { success: true, message: MESSAGES.MAIL.SENT, data: result };
  }
}
