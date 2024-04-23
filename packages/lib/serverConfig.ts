import type SendmailTransport from "nodemailer/lib/sendmail-transport";
import type SMTPConnection from "nodemailer/lib/smtp-connection";

import { isENVDev } from "@calcom/lib/env";

function detectTransport(): SendmailTransport.Options | SMTPConnection.Options | string {
  if (process.env.EMAIL_SERVER) {
    return process.env.EMAIL_SERVER;
  }

  if (process.env.EMAIL_SERVER_HOST) {
    const port = parseInt(process.env.EMAIL_SERVER_PORT || "");
    const auth =
      process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
        ? {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        }
        : undefined;

    const transport = {
      host: process.env.EMAIL_SERVER_HOST,
      port,
      auth,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        requireTLS: true,
      },
    };

    return transport;
  }

  return {
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  };
}

export const serverConfig = {
  transport: detectTransport(),
  from: process.env.EMAIL_FROM,
};
