import type { Order } from "../types/order.ts";
import {
  generateCustomerTaxInvoiceEmailHtml,
  generateAdminOrderAlertEmailHtml,
} from "./emailTemplates.ts";

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
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
  const defaultSender =
    process.env.SENDER_EMAIL?.trim() || "AVSARAA <onboarding@resend.dev>";

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
      `[EmailService:Simulated] Would send email to: ${validRecipients.join(", ")} | Subject: "${payload.subject}"`
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
        from: defaultSender,
        to: validRecipients,
        subject: payload.subject,
        html: payload.html,
        reply_to: payload.replyTo || "contact.avsaraa@gmail.com",
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
      `[EmailService:Success] Dispatched email to ${validRecipients.join(", ")} (ID: ${data?.id})`
    );
    return { success: true, messageId: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown network exception";
    console.error("[EmailService:Exception]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Dispatches the brand-aligned Customer GST Tax Invoice.
 */
export async function sendCustomerOrderInvoice(order: Order): Promise<EmailDispatchResult> {
  const customerEmail = order.shipping_address_snapshot?.email?.trim();
  if (!customerEmail || !customerEmail.includes("@")) {
    return {
      success: false,
      error: "Order does not contain a valid customer email address.",
    };
  }

  const html = generateCustomerTaxInvoiceEmailHtml(order);
  const primaryResult = await sendEmail({
    to: customerEmail,
    subject: `Order Confirmed: #${order.order_number} · Your Avsaraa Tax Invoice`,
    html,
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
        to: sandboxOwner,
        subject: `[Customer Invoice Preview: ${customerEmail}] Order Confirmed: #${order.order_number} · Avsaraa Tax Invoice`,
        html,
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

  const html = generateAdminOrderAlertEmailHtml(order);
  return sendEmail({
    to: adminEmail,
    subject: `🚨 [NEW ORDER] #${order.order_number} · ₹${order.total_amount} · ${order.payment_method}`,
    html,
  });
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
