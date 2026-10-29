import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "TrimURL <noreply@trimurl.com>";

let transporter: nodemailer.Transporter | null = null;

if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  const verificationLink = `${backendUrl}/api/auth/verify?token=${token}`;

  console.log(`[EMAIL] Verification link for ${to}: ${verificationLink}`);

  if (!transporter) {
    console.log("[EMAIL] SMTP_USER/SMTP_PASS not configured. Skipping external email send.");
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: "Verify Your TrimURL Account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #18181b; margin-bottom: 16px;">Welcome to TrimURL! 👋</h2>
          <p style="color: #52525b; font-size: 15px; line-height: 1.5;">
            Thank you for signing up. Please confirm your email address by clicking the button below:
          </p>
          <div style="margin: 28px 0;">
            <a href="${verificationLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
            Or copy and paste this link into your browser:<br/>
            <a href="${verificationLink}" style="color: #2563eb; word-break: break-all;">${verificationLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Verification email sent to ${to}`);
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send verification email to ${to}:`, err.message);
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetLink = `${clientUrl}/reset-password?token=${token}`;

  console.log(`[EMAIL] Password reset link for ${to}: ${resetLink}`);

  if (!transporter) {
    console.log("[EMAIL] SMTP_USER/SMTP_PASS not configured. Skipping external email send.");
    return;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: "Reset Your TrimURL Password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #18181b; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #52525b; font-size: 15px; line-height: 1.5;">
            We received a request to reset your TrimURL password. Click the button below to choose a new password:
          </p>
          <div style="margin: 28px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #71717a; font-size: 13px; line-height: 1.5;">
            This link is valid for 1 hour. If the button doesn't work, copy and paste this URL into your browser:<br/>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">If you didn't ask to reset your password, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[EMAIL] Password reset email sent to ${to}`);
  } catch (err: any) {
    console.error(`[EMAIL] Failed to send password reset email to ${to}:`, err.message);
  }
}
