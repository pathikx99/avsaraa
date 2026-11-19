import type { Order } from "../types/order.ts";
import {
  generateCustomerTaxInvoiceEmailHtml,
  generateAdminOrderAlertEmailHtml,
  generateInquiryAcknowledgementEmailHtml,
  generateEmailVerificationHtml,
} from "./emailTemplates.ts";

export const ORDER_EMAIL = "order@avsaraa.in";
export const SUPPORT_EMAIL = "support@avsaraa.in";
export const VERIFICATION_EMAIL = "support@avsaraa.in";

export const DEFAULT_ORDER_SENDER = "AVSARAA Orders <order@avsaraa.in>";
export const DEFAULT_SUPPORT_SENDER = "AVSARAA Support <support@avsaraa.in>";
export const DEFAULT_VERIFICATION_SENDER = "AVSARAA Support <support@avsaraa.in>";

export function getOrderSender(): string {
  return (
    process.env.ORDER_SENDER_EMAIL?.trim() ||
    DEFAULT_ORDER_SENDER
  );
}

export function getSupportSender(): string {
  return (
    process.env.SUPPORT_SENDER_EMAIL?.trim() ||
    DEFAULT_SUPPORT_SENDER
  );
}

export function getVerificationSender(): string {
  return (
    process.env.VERIFICATION_SENDER_EMAIL?.trim() ||
    process.env.SUPPORT_SENDER_EMAIL?.trim() ||
    DEFAULT_VERIFICATION_SENDER
  );
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Sends a transactional email using the Resend REST API (zero dependencies).
 * Gracefully falls back to simulated development mode when RESEND_API_KEY is not configured.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = payload.from?.trim() || getOrderSender();
  const replyToAddress =
    payload.replyTo?.trim() ||
    (fromAddress.includes("support@") ? SUPPORT_EMAIL : ORDER_EMAIL);

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validRecipients = recipients.filter((r) => r && r.includes("@"));

  if (validRecipients.length === 0) {
    return {
      success: false,
      error: "No valid recipient email addresses provided.",
    };
  }

  // Fallback in local development or CI when Resend API key is not configured
  if (!apiKey) {
    console.info(
      `[EmailService:Simulated] Would send email from: "${fromAddress}" to: ${validRecipients.join(", ")} | Subject: "${payload.subject}"`
    );
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: validRecipients,
        subject: payload.subject,
        html: payload.html,
        reply_to: replyToAddress,
      }),
      signal: AbortSignal.timeout(8000), // 8-second safety timeout
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg =
        data?.message || `Resend API rejected request with HTTP status ${res.status}`;
      console.error("[EmailService:Error]", errMsg, data);
      return { success: false, error: errMsg };
    }

    console.info(
      `[EmailService:Success] Dispatched email from ${fromAddress} to ${validRecipients.join(", ")} (ID: ${data?.id})`
    );
    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown network exception";
    console.error("[EmailService:Exception]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Dispatches the brand-aligned Customer GST Tax Invoice / Bill.
 * Uses order@avsaraa.in as the dedicated sender and reply-to address.
 */
export async function sendCustomerOrderInvoice(order: Order): Promise<EmailDispatchResult> {
  const customerEmail = order.shipping_address_snapshot?.email?.trim();
  if (!customerEmail || !customerEmail.includes("@")) {
    return {
      success: false,
      error: "Order does not contain a valid customer email address.",
    };
  }

  const sender = getOrderSender();
  const html = generateCustomerTaxInvoiceEmailHtml(order);
  const primaryResult = await sendEmail({
    from: sender,
    to: customerEmail,
    subject: `Order Confirmed: #${order.order_number} · Your Avsaraa Tax Invoice`,
    html,
    replyTo: ORDER_EMAIL,
  });

  // If Resend free tier restricts to verified sandbox account (web.avsaraa@gmail.com)
  if (
    !primaryResult.success &&
    primaryResult.error &&
    /only send testing emails/i.test(primaryResult.error)
  ) {
    const sandboxOwner =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "web.avsaraa@gmail.com";
    if (customerEmail.toLowerCase() !== sandboxOwner.toLowerCase()) {
      console.info(
        `[EmailService:SandboxNotice] Forwarding Customer Tax Invoice to verified sandbox inbox (${sandboxOwner}) for verification.`
      );
      return sendEmail({
        from: sender,
        to: sandboxOwner,
        subject: `[Customer Invoice Preview: ${customerEmail}] Order Confirmed: #${order.order_number} · Avsaraa Tax Invoice`,
        html,
        replyTo: ORDER_EMAIL,
      });
    }
  }

  return primaryResult;
}

/**
 * Dispatches the Store Admin Fulfillment and Packing Alert.
 */
export async function sendAdminOrderAlert(order: Order): Promise<EmailDispatchResult> {
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "contact.avsaraa@gmail.com";

  const sender = getOrderSender();
  const html = generateAdminOrderAlertEmailHtml(order);
  return sendEmail({
    from: sender,
    to: adminEmail,
    subject: `🚨 [NEW ORDER] #${order.order_number} · ₹${order.total_amount} · ${order.payment_method}`,
    html,
    replyTo: ORDER_EMAIL,
  });
}

export interface InquiryAcknowledgementPayload {
  customerName: string;
  customerEmail: string;
  subject?: string;
  message: string;
  inquiryId?: string;
}

/**
 * Dispatches a personalized enquiry acknowledgement email to the customer.
 * Strictly uses support@avsaraa.in as the sender and reply-to address.
 */
export async function sendInquiryAcknowledgementEmail(
  payload: InquiryAcknowledgementPayload
): Promise<EmailDispatchResult> {
  const customerEmail = payload.customerEmail?.trim();
  if (!customerEmail || !customerEmail.includes("@")) {
    return {
      success: false,
      error: "Inquiry does not contain a valid customer email address.",
    };
  }

  const sender = getSupportSender();
  const html = generateInquiryAcknowledgementEmailHtml(payload);
  const subjectLine = payload.subject
    ? `We've Received Your Inquiry: ${payload.subject} · Avsaraa Support`
    : `We've Received Your Inquiry · Avsaraa Support`;

  const primaryResult = await sendEmail({
    from: sender,
    to: customerEmail,
    subject: subjectLine,
    html,
    replyTo: SUPPORT_EMAIL,
  });

  // Sandbox fallback when running in Resend restricted testing domain mode
  if (
    !primaryResult.success &&
    primaryResult.error &&
    /only send testing emails/i.test(primaryResult.error)
  ) {
    const sandboxOwner =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "web.avsaraa@gmail.com";
    if (customerEmail.toLowerCase() !== sandboxOwner.toLowerCase()) {
      console.info(
        `[EmailService:SandboxNotice] Forwarding Inquiry Acknowledgement to verified sandbox inbox (${sandboxOwner}) for verification.`
      );
      return sendEmail({
        from: sender,
        to: sandboxOwner,
        subject: `[Customer Inquiry Preview: ${customerEmail}] ${subjectLine}`,
        html,
        replyTo: SUPPORT_EMAIL,
      });
    }
  }

  return primaryResult;
}

export interface SendVerificationEmailPayload {
  to: string;
  otp?: string;
  verificationUrl?: string;
  name?: string;
}

/**
 * Dispatches an official email verification message.
 * Strictly uses support@avsaraa.in as the sender and reply-to address.
 */
export async function sendEmailVerificationEmail(
  payload: SendVerificationEmailPayload
): Promise<EmailDispatchResult> {
  const customerEmail = payload.to?.trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes("@")) {
    return {
      success: false,
      error: "No valid recipient email address provided for verification.",
    };
  }

  const sender = getVerificationSender();
  const html = generateEmailVerificationHtml(payload);
  const subject = payload.otp
    ? `${payload.otp} is your Avsaraa email verification code`
    : `Verify your email address · Avsaraa`;

  const primaryResult = await sendEmail({
    from: sender,
    to: customerEmail,
    subject,
    html,
    replyTo: VERIFICATION_EMAIL,
  });

  if (
    !primaryResult.success &&
    primaryResult.error &&
    /only send testing emails/i.test(primaryResult.error)
  ) {
    const sandboxOwner =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "web.avsaraa@gmail.com";
    if (customerEmail.toLowerCase() !== sandboxOwner.toLowerCase()) {
      console.info(
        `[EmailService:SandboxNotice] Forwarding Email Verification to verified sandbox inbox (${sandboxOwner}) for verification.`
      );
      return sendEmail({
        from: sender,
        to: sandboxOwner,
        subject: `[Email Verification Preview: ${customerEmail}] ${subject}`,
        html,
        replyTo: VERIFICATION_EMAIL,
      });
    }
  }

  return primaryResult;
}

/**
 * Dispatches both customer tax invoice and admin fulfillment alert simultaneously.
 * Non-blocking: will never crash the calling HTTP endpoint.
 */
export async function dispatchOrderSuccessEmails(
  order: Order
): Promise<{ customer: EmailDispatchResult; admin: EmailDispatchResult }> {
  try {
    const [customerRes, adminRes] = await Promise.allSettled([
      sendCustomerOrderInvoice(order),
      sendAdminOrderAlert(order),
    ]);

    const customer =
      customerRes.status === "fulfilled"
        ? customerRes.value
        : { success: false, error: String(customerRes.reason) };

    const admin =
      adminRes.status === "fulfilled"
        ? adminRes.value
        : { success: false, error: String(adminRes.reason) };

    return { customer, admin };
  } catch (err) {
    console.warn("[EmailService:AllSettled Exception]", err);
    return {
      customer: { success: false, error: "Failed to dispatch" },
      admin: { success: false, error: "Failed to dispatch" },
    };
  }
}
