import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailDispatcherDto } from './dto/send-mail.dto';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly configService: ConfigService) {}

  async emailDispatcher(mailDispatcher: MailDispatcherDto) {
    const mailOptions = {
      to: mailDispatcher.to,
      from: mailDispatcher.from,
      subject: mailDispatcher.subject ?? 'Testing Email',
      text: mailDispatcher.text,
      html: mailDispatcher.html,
    };

    const transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_SERVER'),
      port: parseInt(this.configService.get('SMTP_PORT') || '465'),
      secure: true, // true for 465, false for other ports.
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });

    transporter
      .sendMail(mailOptions)
      .then((response: any) => {
        this.logger.log('Email sent successfully');
      })
      .catch((error) => {
        this.logger.error('Error sending email:', error);
      });
  }
}
