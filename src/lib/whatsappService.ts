import { normalizePhoneNumber } from "./phoneUtils.ts";

export interface WhatsAppDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface SendWhatsAppOtpPayload {
  to: string;
  otp: string;
}

/**
 * Sends a WhatsApp OTP using Meta WhatsApp Cloud API or Twilio WhatsApp API.
 * Gracefully falls back to simulated development mode when WhatsApp credentials are not configured.
 */
export async function sendWhatsAppOtp(
  payload: SendWhatsAppOtpPayload
): Promise<WhatsAppDispatchResult> {
  const { to, otp } = payload;

  const validation = normalizePhoneNumber(to);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || "Invalid mobile number for WhatsApp dispatch.",
    };
  }

  const cleanE164 = validation.normalized; // e.g. "+919876543210"
  const digitsOnly = cleanE164.replace(/\D/g, ""); // e.g. "919876543210"

  // Pre-check: Meta Cloud API prohibits a WhatsApp business number from sending messages to itself (+91 94292 43344)
  const businessSenderDigits = (process.env.WHATSAPP_SENDER_PHONE || "919429243344").replace(/\D/g, "");
  if (digitsOnly === businessSenderDigits || digitsOnly === "919429243344") {
    return {
      success: false,
      error: "Cannot send verification OTP to the business sender number. Please use a patron mobile number.",
    };
  }

  // 1. Check for Meta WhatsApp Cloud API credentials
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();

  // 2. Check for Twilio WhatsApp credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM?.trim() || "whatsapp:+14155238886";

  // Simulation mode in development, testing, or before API credentials are provided
  if (!metaToken && !twilioSid) {
    console.info(
      `[WhatsAppService:Simulated] Would send WhatsApp OTP "${otp}" to: ${cleanE164}`
    );
    return {
      success: true,
      simulated: true,
      messageId: `wa_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  // A. Meta WhatsApp Business Cloud API (Official Graph API)
  if (metaToken && metaPhoneId) {
    try {
      const url = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;

      let requestBody: Record<string, unknown>;

      if (templateName) {
        const hasUrlButton =
          process.env.WHATSAPP_TEMPLATE_HAS_BUTTON === "true" ||
          process.env.WHATSAPP_TEMPLATE_BUTTON === "url";

        const components: Array<Record<string, unknown>> = [
          {
            type: "body",
            parameters: [{ type: "text", text: otp }],
          },
        ];

        if (hasUrlButton) {
          components.push({
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: otp }],
          });
        }

        requestBody = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: digitsOnly,
          type: "template",
          template: {
            name: templateName,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
            components,
          },
        };
      } else {
        if (process.env.NODE_ENV === "production") {
          console.warn(
            "[WhatsAppService] Warning: WHATSAPP_TEMPLATE_NAME is not configured. Meta Cloud API rejects freeform text messages initiated to patrons outside the 24-hour service window."
          );
        }
        requestBody = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: digitsOnly,
          type: "text",
          text: {
            body: `Your Avsaraa Atelier verification code is ${otp}. Valid for 5 minutes. Please do not share this code.`,
          },
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || `Meta API HTTP ${res.status}`;
        console.error("[WhatsAppService:MetaError]", errorMsg, data.error);
        return { success: false, error: errorMsg };
      }

      const messageId = data.messages?.[0]?.id || `wa_${Date.now()}`;
      return { success: true, messageId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "WhatsApp dispatch error";
      console.error("[WhatsAppService:MetaException]", msg);
      return { success: false, error: msg };
    }
  }

  // B. Twilio WhatsApp API
  if (twilioSid && twilioAuth) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", `whatsapp:${cleanE164}`);
      params.append(
        "From",
        twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`
      );
      params.append(
        "Body",
        `Your Avsaraa Atelier verification code is ${otp}. Valid for 5 minutes. Please do not share this code.`
      );

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok || data.error_code) {
        const errorMsg = data.message || `Twilio HTTP ${res.status}`;
        console.error("[WhatsAppService:TwilioError]", errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true, messageId: data.sid };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Twilio dispatch error";
      console.error("[WhatsAppService:TwilioException]", msg);
      return { success: false, error: msg };
    }
  }

  return { success: false, error: "No configured WhatsApp provider found." };
}
