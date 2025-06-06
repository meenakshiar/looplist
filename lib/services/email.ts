// PRD: Auth
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Environment checks
const isDevelopment = process.env.NODE_ENV === "development";
const useMockEmail =
  isDevelopment &&
  !process.env.RESEND_API_KEY &&
  !process.env.GMAIL_APP_PASSWORD;
const useNodemailer =
  process.env.USE_NODEMAILER === "true" ||
  (!process.env.RESEND_API_KEY && process.env.GMAIL_APP_PASSWORD);

// Email provider interface
interface EmailProvider {
  send: (options: EmailOptions) => Promise<EmailResult>;
}

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface EmailResult {
  data: any;
  error: any;
}

// Initialize Resend with API key or create a mock implementation
const resend = useMockEmail
  ? mockResend()
  : new Resend(process.env.RESEND_API_KEY || "");

// Create a mock implementation for development
function mockResend() {
  console.warn(
    "Using mock email service for development. Emails will be logged to console."
  );

  return {
    emails: {
      send: async (options: any) => {
        console.log("🌐 MOCK EMAIL SENT:");
        console.log("  From:", options.from);
        console.log("  To:", options.to);
        console.log("  Subject:", options.subject);
        console.log("  HTML Preview:", options.html.substring(0, 100) + "...");

        return {
          data: {
            id: `mock_email_${Date.now()}`,
            from: options.from,
            to: options.to,
            subject: options.subject,
          },
          error: null,
        };
      },
    },
  };
}

// Nodemailer provider implementation
class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create Nodemailer transporter using Gmail
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || "",
        pass: process.env.GMAIL_APP_PASSWORD || "",
      },
      secure: true,
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });

    console.log("Using Nodemailer with Gmail for sending emails");
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      return {
        data: {
          id: info.messageId,
          from: options.from,
          to: options.to,
          subject: options.subject,
        },
        error: null,
      };
    } catch (error) {
      console.error("Failed to send email with Nodemailer:", error);
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Unknown error sending email",
          code: "nodemailer_error",
        },
      };
    }
  }
}

// Resend provider implementation
class ResendProvider implements EmailProvider {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    return this.client.emails.send(options);
  }
}

// Mock provider implementation
class MockProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    console.log("🌐 MOCK EMAIL SENT:");
    console.log("  From:", options.from);
    console.log("  To:", options.to);
    console.log("  Subject:", options.subject);
    console.log("  HTML Preview:", options.html.substring(0, 100) + "...");

    return {
      data: {
        id: `mock_email_${Date.now()}`,
        from: options.from,
        to: options.to,
        subject: options.subject,
      },
      error: null,
    };
  }
}

// Select the appropriate email provider
let emailProvider: EmailProvider;

if (useMockEmail) {
  emailProvider = new MockProvider();
} else if (useNodemailer) {
  emailProvider = new NodemailerProvider();
} else {
  emailProvider = new ResendProvider(resend);
}

/**
 * Send a verification email to a user
 * @param email User's email address
 * @param token Verification token
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/verify?token=${token}`;
  const fromEmail: any = process.env.EMAIL_FROM;

  const { data, error } = await emailProvider.send({
    from: fromEmail,
    to: email,
    subject: "Verify Your LoopList Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580b;">Welcome to LoopList!</h2>
        <p>Thanks for signing up. Please verify your email address to continue.</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #ea580b; color: white; 
                  text-decoration: none; padding: 10px 20px; margin: 20px 0; 
                  border-radius: 4px; font-weight: bold;">
          Verify Email
        </a>
        <p>Or copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This verification link will expire in 6 hours.</p>
        <p>If you didn't sign up for LoopList, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  return data;
}

/**
 * Send a password reset email to a user
 * @param email User's email address
 * @param token Reset token
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  console.log('abc')
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset?token=${token}`;
  const fromEmail = process.env.EMAIL_FROM || "noreply@looplist.app";

  const { data, error } = await emailProvider.send({
    from: fromEmail,
    to: email,
    subject: "Reset Your LoopList Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ea580b;">Reset Your Password</h2>
        <p>You requested a password reset for your LoopList account.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background-color: #ea580b; color: white; 
                  text-decoration: none; padding: 10px 20px; margin: 20px 0; 
                  border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
        <p>Or copy and paste the following URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This reset link will expire in 1 hour.</p>
        <p>If you didn't request this reset, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  return data;
}
