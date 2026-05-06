import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly webUrl: string;

  constructor() {
    this.from = process.env.SMTP_FROM ?? 'Noetia <noreply@noetia.app>';
    this.webUrl = process.env.WEB_URL ?? 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'mailhog',
      port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } }
        : {}),
    });
  }

  async sendEmailConfirmation(to: string, name: string, token: string): Promise<void> {
    const link = `${this.webUrl}/auth/confirm-email?token=${token}`;
    await this.send({
      to,
      subject: 'Confirma tu cuenta en Noetia',
      html: this.confirmationTemplate(name, link),
    });
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const link = `${this.webUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Recupera tu contraseña en Noetia',
      html: this.passwordResetTemplate(name, link),
    });
  }

  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, ...opts });
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${(err as Error).message}`);
    }
  }

  private confirmationTemplate(name: string, link: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0D1B2A;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">NOETIA</h1>
          <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Lee. Escucha. Comparte.</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;color:#1E293B;font-size:18px;font-weight:600;">¡Bienvenido/a, ${this.escape(name)}!</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Gracias por crear tu cuenta. Confirma tu dirección de correo para comenzar a leer, escuchar y compartir fragmentos.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#0D1B2A;border-radius:8px;padding:14px 32px;text-align:center;">
              <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Confirmar mi cuenta</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-align:center;">
            Si el botón no funciona, copia este enlace en tu navegador:
          </p>
          <p style="margin:0;color:#0D1B2A;font-size:12px;text-align:center;word-break:break-all;">${link}</p>
          <p style="margin:32px 0 0;color:#CBD5E1;font-size:12px;text-align:center;">
            Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
          </p>
        </td></tr>
        <tr><td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} Noetia. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private passwordResetTemplate(name: string, link: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0D1B2A;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">NOETIA</h1>
          <p style="margin:6px 0 0;color:#94A3B8;font-size:13px;">Lee. Escucha. Comparte.</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;color:#1E293B;font-size:18px;font-weight:600;">Hola, ${this.escape(name)}</p>
          <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#0D1B2A;border-radius:8px;padding:14px 32px;text-align:center;">
              <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Restablecer contraseña</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;text-align:center;">
            Si el botón no funciona, copia este enlace en tu navegador:
          </p>
          <p style="margin:0;color:#0D1B2A;font-size:12px;text-align:center;word-break:break-all;">${link}</p>
          <p style="margin:32px 0 0;color:#CBD5E1;font-size:12px;text-align:center;">
            Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje — tu contraseña no será modificada.
          </p>
        </td></tr>
        <tr><td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0;color:#94A3B8;font-size:12px;">© ${new Date().getFullYear()} Noetia. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
