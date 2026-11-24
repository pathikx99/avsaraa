import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sendWhatsAppOtp } from "../../src/lib/whatsappService.ts";
import {
  issueContactProofToken,
  verifyContactProofToken,
  validateOrderContacts,
  isContactProofTokenConsumed,
  consumeContactProofTokens,
} from "../../src/lib/contactVerification.ts";

describe("WhatsApp Service & Dual-Contact Verification Suite", () => {
  describe("1. WhatsApp OTP Messaging Service", () => {
    it("Rejects invalid mobile numbers with meaningful validation error", async () => {
      const res = await sendWhatsAppOtp({ to: "123", otp: "555555" });
      assert.equal(res.success, false);
      assert.match(res.error || "", /must be between 10 and 15 digits/i);
    });

    it("Dispatches WhatsApp OTP in graceful simulation mode when credentials not set", async () => {
      const origToken = process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      try {
        const res = await sendWhatsAppOtp({ to: "9876543210", otp: "847291" });
        assert.equal(res.success, true);
        assert.equal(res.simulated, true);
        assert.ok(res.messageId?.startsWith("wa_sim_"));
      } finally {
        if (origToken) process.env.WHATSAPP_ACCESS_TOKEN = origToken;
      }
    });

    it("Accepts properly formatted E.164 Indian mobile number", async () => {
      const origToken = process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      try {
        const res = await sendWhatsAppOtp({ to: "+919876543210", otp: "123456" });
        assert.equal(res.success, true);
        assert.equal(res.simulated, true);
      } finally {
        if (origToken) process.env.WHATSAPP_ACCESS_TOKEN = origToken;
      }
    });

    it("Rejects sending OTP to business sender mobile number", async () => {
      const res = await sendWhatsAppOtp({ to: "9429243344", otp: "123456" });
      assert.equal(res.success, false);
      assert.match(res.error || "", /Cannot send verification OTP to the business sender number/i);
    });
  });

  describe("2. Cryptographic Contact Proof Tokens", () => {
    it("Issues and verifies valid phone proof token", () => {
      const phone = "+919876543210";
      const token = issueContactProofToken(phone, "order_phone");
      assert.ok(token);

      const check = verifyContactProofToken(token, phone, "order_phone");
      assert.equal(check.valid, true);
    });

    it("Issues and verifies valid email proof token", () => {
      const email = "priya.sharma@example.com";
      const token = issueContactProofToken(email, "order_email");
      assert.ok(token);

      const check = verifyContactProofToken(token, email, "order_email");
      assert.equal(check.valid, true);
    });

    it("Strictly rejects token when contact does not match", () => {
      const token = issueContactProofToken("+919876543210", "order_phone");
      const check = verifyContactProofToken(token, "+919999999999", "order_phone");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /different contact/i);
    });

    it("Strictly rejects forged or tampered token signatures", () => {
      const token = issueContactProofToken("user@example.com", "order_email");
      const tampered = token.slice(0, -4) + "abcd";
      const check = verifyContactProofToken(tampered, "user@example.com", "order_email");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /cryptographic signature/i);
    });

    it("Strictly rejects expired proof tokens", () => {
      const email = "user@example.com";
      const token = issueContactProofToken(email, "order_email");
      // Simulate checking with maxAgeMs = -1 (already expired)
      const check = verifyContactProofToken(token, email, "order_email", -1000);
      assert.equal(check.valid, false);
      assert.match(check.error || "", /expired/i);
    });

    it("Strictly rejects token when purpose does not match expected purpose", () => {
      const contact = "rohan@example.com";
      const token = issueContactProofToken(contact, "order_email");
      // Try to present order_email token for order_phone
      const check = verifyContactProofToken(token, contact, "order_phone");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /purpose mismatch/i);
    });

    it("Detects single-use token consumption and prevents token replay", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage: Record<string, any> = {};
      const mockClient = {
        from: () => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          insert: async (data: any) => {
            storage[data.otp_hash] = data;
            return { error: null };
          },
          select: () => ({
            eq: (_col: string, val: string) => ({
              limit: async () => ({
                data: storage[val] ? [storage[val]] : [],
                error: null,
              }),
            }),
          }),
        }),
      };

      const phone = "+919876543210";
      const token = issueContactProofToken(phone, "order_phone");

      // Initially not consumed
      const consumedBefore = await isContactProofTokenConsumed(token, mockClient);
      assert.equal(consumedBefore, false);

      // Consume token
      await consumeContactProofTokens({ phone_token: token }, mockClient);

      // Now consumed
      const consumedAfter = await isContactProofTokenConsumed(token, mockClient);
      assert.equal(consumedAfter, true);
    });
  });

  describe("3. Order Dual-Contact Verification Engine", () => {
    it("Rejects order when neither WhatsApp phone nor email is verified", () => {
      const check = validateOrderContacts({
        phone: "9876543210",
        email: "rohan@example.com",
        verificationTokens: {
          phone_token: undefined,
          email_token: undefined,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /Both WhatsApp mobile number and email address/i);
    });

    it("Rejects order when WhatsApp phone token is missing or invalid", () => {
      const email = "rohan@example.com";
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone: "9876543210",
        email,
        verificationTokens: {
          phone_token: undefined,
          email_token: emailToken,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /verified via WhatsApp OTP/i);
    });

    it("Rejects order when email token is missing or invalid", () => {
      const phone = "+919876543210";
      const phoneToken = issueContactProofToken(phone, "order_phone");

      const check = validateOrderContacts({
        phone,
        email: "rohan@example.com",
        verificationTokens: {
          phone_token: phoneToken,
          email_token: undefined,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /verified via Email OTP/i);
    });

    it("Accepts order when both valid WhatsApp and Email tokens are provided", () => {
      const phone = "+919876543210";
      const email = "rohan@example.com";

      const phoneToken = issueContactProofToken(phone, "order_phone");
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone,
        email,
        verificationTokens: {
          phone_token: phoneToken,
          email_token: emailToken,
        },
      });

      assert.equal(check.valid, true);
      assert.equal(check.phoneVerified, true);
      assert.equal(check.emailVerified, true);
    });

    it("Accepts order for authenticated user with pre-verified session credentials", () => {
      const phone = "+919876543210";
      const email = "ananya@example.com";

      const check = validateOrderContacts({
        phone,
        email,
        user: {
          id: "u-12345",
          email,
          email_confirmed_at: new Date().toISOString(),
          phone,
          phone_confirmed_at: new Date().toISOString(),
        },
        userProfile: {
          phone_number: phone,
          phone_verified: true,
          email,
        },
      });

      assert.equal(check.valid, true);
      assert.equal(check.phoneVerified, true);
      assert.equal(check.emailVerified, true);
    });

    it("Rejects synthetic @phone.avsaraa.in as verified user email for orders", () => {
      const phone = "+919876543210";
      const phoneToken = issueContactProofToken(phone, "order_phone");
      const check = validateOrderContacts({
        phone,
        email: "919876543210@phone.avsaraa.in",
        verificationTokens: {
          phone_token: phoneToken,
          email_token: undefined,
        },
        user: {
          id: "u-whatsapp",
          email: "919876543210@phone.avsaraa.in",
          email_confirmed_at: new Date().toISOString(),
          phone,
          phone_confirmed_at: new Date().toISOString(),
        },
      });

      assert.equal(check.valid, false);
      assert.equal(check.emailVerified, false);
      assert.match(check.error || "", /verified via Email OTP/i);
    });

    it("Strictly rejects unverified profile phone number from bypassing phone verification", () => {
      const phone = "+919876543210";
      const email = "priya@example.com";
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone,
        email,
        verificationTokens: {
          email_token: emailToken,
        },
        user: {
          id: "u-12345",
          email,
          email_confirmed_at: new Date().toISOString(),
          phone: null,
          phone_confirmed_at: null,
        },
        userProfile: {
          phone_number: phone,
          phone_verified: false, // Not verified!
          email,
        },
      });

      assert.equal(check.valid, false);
      assert.equal(check.phoneVerified, false);
      assert.match(check.error || "", /verified via WhatsApp OTP/i);
    });

    it("Production mode strictly rejects unverified contacts even when ENABLE_TEST_OTP is set", () => {
      const envRef = process.env as Record<string, string | undefined>;
      const origNodeEnv = envRef.NODE_ENV;
      const origTestOtp = envRef.ENABLE_TEST_OTP;
      envRef.NODE_ENV = "production";
      envRef.ENABLE_TEST_OTP = "true";

      try {
        const check = validateOrderContacts({
          phone: "9876543210",
          email: "guest@example.com",
        });
        assert.equal(check.valid, false);
        assert.match(check.error || "", /Both WhatsApp mobile number and email address/i);
      } finally {
        envRef.NODE_ENV = origNodeEnv;
        if (origTestOtp !== undefined) {
          envRef.ENABLE_TEST_OTP = origTestOtp;
        } else {
          delete envRef.ENABLE_TEST_OTP;
        }
      }
    });
  });
});
