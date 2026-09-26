import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';
import {
  contactAckEmail,
  deliveredEmail,
  newsletterWelcomeEmail,
  orderConfirmationEmail,
  shippedEmail,
} from './email.templates.js';

let transporter;
let resend;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.smtp.host) return null;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
};

const getResend = () => {
  if (resend) return resend;
  if (!env.resendApiKey) return null;
  resend = new Resend(env.resendApiKey);
  return resend;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!env.emailEnabled) {
    console.log(`[email:dev] → ${to} | ${subject}`);
    return { ok: true, mocked: true };
  }

  const client = getResend();
  if (client) {
    await client.emails.send({
      from: env.emailFrom,
      to: [to],
      subject,
      html,
      text,
    });
    return { ok: true, provider: 'resend' };
  }

  const smtp = getTransporter();
  if (smtp) {
    await smtp.sendMail({
      from: env.emailFrom,
      to,
      subject,
      html,
      text,
    });
    return { ok: true, provider: 'smtp' };
  }

  console.log(`[email:fallback] → ${to} | ${subject}`);
  return { ok: true, mocked: true };
};

const safeSend = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    console.error('[email] failed:', err.message);
    return { ok: false, error: err.message };
  }
};

export const sendOrderConfirmation = (order) =>
  safeSend(async () => {
    const tpl = orderConfirmationEmail(order);
    return sendEmail({ to: order.email, ...tpl });
  });

export const sendShippedNotice = (order) =>
  safeSend(async () => {
    const tpl = shippedEmail(order);
    return sendEmail({ to: order.email, ...tpl });
  });

export const sendDeliveredNotice = (order) =>
  safeSend(async () => {
    const tpl = deliveredEmail(order);
    return sendEmail({ to: order.email, ...tpl });
  });

export const sendNewsletterWelcome = (email) =>
  safeSend(async () => {
    const tpl = newsletterWelcomeEmail();
    return sendEmail({ to: email, ...tpl });
  });

export const sendContactAck = ({ name, email }) =>
  safeSend(async () => {
    const tpl = contactAckEmail({ name });
    return sendEmail({ to: email, ...tpl });
  });
