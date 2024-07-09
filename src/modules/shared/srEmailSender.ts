import nodemailer, { Transporter } from 'nodemailer';
import { Env } from '../../base/loaders/appLoader';
import { stdLog } from '../../utils/logger';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export const getTransport = (): Transporter => {
  const config = {
    host: Env.email_sending.SMTP_HOST,
    port: Number(Env.email_sending.SMTP_PORT),
    auth: {
      user: Env.email_sending.SMTP_USER,
      pass: Env.email_sending.SMTP_PASS,
    },
  };

  return nodemailer.createTransport(config);
};

export const sendEmail = async (
  transporter: Transporter,
  to: string,
  subject: string,
  html: string
): Promise<{ status: any; message: any; }> => {
  if (to && to !== "") {
    try {
      const mailOptions: MailOptions = {
        from: Env.email_sending.SMTP_USER,
        to,
        subject,
        html
      };
      const resp = transporter.sendMail(mailOptions).then((info) => ({
        status: 200,
        message: info.response,
      })).catch((err) => {
        console.error(`------- Nodemailer Error -------\n${err}`);
        return { status: err?.responseCode ?? 403, message: err?.response ?? err as string };
      });

      return resp;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  } else { stdLog(`No email sent, empty email ${to}`, "warning") }
};
