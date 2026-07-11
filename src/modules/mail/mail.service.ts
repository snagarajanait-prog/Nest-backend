import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as handlebars from 'handlebars';

export type MailTemplate = 'welcome' | 'reset-password' | 'invoice';

// nodemailer's sendMail is typed loosely (any); this is the concrete
// SentMessageInfo type that getTestMessageUrl accepts (it has `messageId`).
type SentInfo = Parameters<typeof nodemailer.getTestMessageUrl>[0];

export interface SendTemplateOptions {
  to: string;
  subject: string;
  template: MailTemplate;
  context: Record<string, unknown>;
  attachments?: SendMailOptions['attachments'];
}

export interface SendResult {
  messageId: string;
  previewUrl: string | false;
  transport: 'smtp' | 'ethereal' | 'json';
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private transport: 'smtp' | 'ethereal' | 'json' = 'json';
  private readonly templateCache = new Map<
    string,
    handlebars.TemplateDelegate
  >();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initTransport();
  }

  /**
   * Pick a transport in this order:
   *  1. Real SMTP if MAIL_HOST is configured.
   *  2. Ethereal test inbox (online) — captures mail + gives a preview URL.
   *  3. JSON transport (offline fallback) — never fails, "sends" to an object.
   */
  private async initTransport(): Promise<void> {
    const host = this.config.get<string>('mail.host');
    try {
      if (host) {
        this.transporter = nodemailer.createTransport({
          host,
          port: this.config.get<number>('mail.port') ?? 587,
          secure: this.config.get<boolean>('mail.secure') ?? false,
          auth: {
            user: this.config.get<string>('mail.user'),
            pass: this.config.get<string>('mail.pass'),
          },
        });
        this.transport = 'smtp';
        this.logger.log(`Mail transport ready (SMTP: ${host})`);
        return;
      }

      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      this.transport = 'ethereal';
      this.logger.warn(
        `No MAIL_HOST set — using Ethereal test inbox (${testAccount.user})`,
      );
    } catch (error) {
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      this.transport = 'json';
      this.logger.warn(
        'Falling back to JSON mail transport (no network / SMTP unavailable)',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async sendTemplate(options: SendTemplateOptions): Promise<SendResult> {
    const html = this.render(options.template, options.context);
    const from =
      this.config.get<string>('mail.from') ??
      'Nest App <no-reply@nest-app.local>';

    const info = (await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html,
      attachments: options.attachments,
    })) as unknown as SentInfo;

    const previewUrl =
      this.transport === 'ethereal'
        ? nodemailer.getTestMessageUrl(info)
        : false;

    this.logger.log(
      `Mail sent to ${options.to} via ${this.transport} (id: ${info.messageId})`,
    );
    if (previewUrl) {
      this.logger.log(`Preview URL: ${previewUrl}`);
    }

    return { messageId: info.messageId, previewUrl, transport: this.transport };
  }

  /** Compile (and cache) a Handlebars template, then render with context. */
  private render(
    template: MailTemplate,
    context: Record<string, unknown>,
  ): string {
    let compiled = this.templateCache.get(template);
    if (!compiled) {
      const filePath = join(__dirname, 'templates', `${template}.hbs`);
      const source = readFileSync(filePath, 'utf8');
      compiled = handlebars.compile(source);
      this.templateCache.set(template, compiled);
    }
    return compiled(context);
  }
}
