import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';
import { recordLog } from '../utils/live-log.js';
import {
  aftercareEmail,
  cancelledEmail,
  contactAckEmail,
  deliveredEmail,
  newsletterWelcomeEmail,
  orderConfirmationEmail,
  shippedEmail,
  welcomeEmail,
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
  if (!to) return { ok: false, error: 'No recipient' };

  const client = getResend();
  if (client) {
    const result = await client.emails.send({
      from: env.emailFrom,
      to: [to],
      subject,
      html,
      text,
    });
    if (result?.error) {
      const message = result.error.message || 'Resend rejected the email';
      console.error(`[email] resend failed → ${to} | ${subject} | ${message}`);
      recordLog('system', { level: 'danger', message: `Email failed for ${to}: ${message}` });
      return { ok: false, provider: 'resend', error: message };
    }
    console.log(`[email] sent → ${to} | ${subject}`);
    return { ok: true, provider: 'resend', id: result?.data?.id || null };
  }

  if (!env.emailEnabled) {
    console.error(`[email] not sent → ${to} | ${subject} | RESEND_API_KEY is empty`);
    recordLog('system', { level: 'warn', message: `Email not sent to ${to}. RESEND_API_KEY is empty.` });
    return { ok: false, error: 'RESEND_API_KEY is empty' };
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
    recordLog('system', { level: 'danger', message: `Email failed: ${err.message}` });
    return { ok: false, error: err.message };
  }
};

export const sendWelcome = ({ name, email }) =>
  safeSend(async () => {
    const tpl = welcomeEmail({ name });
    return sendEmail({ to: email, ...tpl });
  });

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

export const sendAftercareNotice = (order) =>
  safeSend(async () => {
    const tpl = aftercareEmail(order);
    return sendEmail({ to: order.email, ...tpl });
  });

export const sendCancelledNotice = (order) =>
  safeSend(async () => {
    const tpl = cancelledEmail(order);
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
