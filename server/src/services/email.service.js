import nodemailer from 'nodemailer';
import { env, emailConfigured, isProd } from '../config/env.js';
import { log } from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (!emailConfigured) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/**
 * Sends an email via SMTP, or logs it in development when SMTP isn't configured.
 * In production with no SMTP configured we log loudly but do NOT throw — verification
 * links still surface in logs and the UI explains that email isn't configured.
 */
export async function sendEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    log.warn('Email not configured — message dumped to log', { to, subject, body: text });
    if (isProd) log.error('SMTP is not configured; password-reset/verification email was NOT delivered', { to });
    return { delivered: false };
  }
  try {
    await tx.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true };
  } catch (err) {
    log.error('Email send failed', { to, subject, message: err.message });
    return { delivered: false };
  }
}

export function verificationEmail(url) {
  return {
    subject: 'Verify your CSS Visual account',
    text: `Welcome to CSS Visual! Verify your email:\n${url}\n\nIf you didn't create an account, ignore this email.`,
  };
}

export function passwordResetEmail(url) {
  return {
    subject: 'Reset your CSS Visual password',
    text: `Reset your password (link valid for 1 hour):\n${url}\n\nIf you didn't request this, ignore this email — your password is unchanged.`,
  };
}
