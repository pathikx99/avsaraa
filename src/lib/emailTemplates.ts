import type { Order } from "../types/order.ts";
import { formatINR } from "./productUtils.ts";
import { computeInclusiveGst } from "./financials.ts";

/**
 * Escapes unsafe characters for HTML interpolation to prevent Email Injection and XSS.
 */
export function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates responsive, brand-aligned HTML invoice email template for customer orders.
 */
export function generateOrderConfirmationEmailHtml(order: Order): string {
  const safeOrderNumber = escapeHtml(order.order_number);
  const safeRecipient = escapeHtml(order.shipping_address_snapshot.recipient_name);
  const safePhone = escapeHtml(order.shipping_address_snapshot.phone_number);
  const safeAddress1 = escapeHtml(order.shipping_address_snapshot.address_line1);
  const safeAddress2 = escapeHtml(order.shipping_address_snapshot.address_line2 || "");
  const safeCity = escapeHtml(order.shipping_address_snapshot.city);
  const safeState = escapeHtml(order.shipping_address_snapshot.state);
  const safePin = escapeHtml(order.shipping_address_snapshot.postal_code);
  const safeMethod = escapeHtml(order.payment_method);
  const safeStatus = escapeHtml(order.payment_status);
  const safeNotes = escapeHtml(order.notes || "None");

  const itemsHtml = (order.order_items || [])
    .map((item) => {
      const name = escapeHtml(item.product_name);
      const size = escapeHtml(item.size || "Standard");
      const color = escapeHtml(item.color || "Default");
      const qty = Number(item.quantity) || 1;
      const unit = formatINR(item.unit_price);
      const total = formatINR(item.total_price);
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #EFEAE3; font-size: 14px; color: #261B13;">
            <strong>${name}</strong><br />
            <span style="font-size: 12px; color: #866951;">Variant/Size: ${size} | Color: ${color}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #EFEAE3; font-size: 14px; text-align: center; color: #261B13;">${qty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EFEAE3; font-size: 14px; text-align: right; color: #261B13;">${unit}</td>
          <td style="padding: 12px; border-bottom: 1px solid #EFEAE3; font-size: 14px; text-align: right; color: #261B13; font-weight: 600;">${total}</td>
        </tr>
      `;
    })
    .join("");

  const { gstAmount, taxableAmount } = computeInclusiveGst(order.subtotal - order.discount_amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation - ${safeOrderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #261B13;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EAE3D9;">
    <!-- Header -->
    <tr>
      <td style="background-color: #261B13; padding: 28px 32px; text-align: center;">
        <h1 style="color: #FAF7F2; font-size: 24px; letter-spacing: 0.15em; margin: 0; font-weight: 300; text-transform: uppercase;">AVSARAA</h1>
        <p style="color: #D4BEAA; font-size: 11px; letter-spacing: 0.2em; margin: 6px 0 0 0; text-transform: uppercase;">Haute Couture & Heirloom Handlooms</p>
      </td>
    </tr>

    <!-- Salutation -->
    <tr>
      <td style="padding: 32px 32px 16px 32px;">
        <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #261B13;">Thank you for your order, ${safeRecipient}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #55504A; margin: 0;">
          Your order <strong>#${safeOrderNumber}</strong> has been received by our Surat atelier team. Below is the official summary and tax invoice for your records.
        </p>
      </td>
    </tr>

    <!-- Items Table -->
    <tr>
      <td style="padding: 16px 32px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #F8F5F0;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #866951;">Item</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #866951;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #866951;">Price</th>
              <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #866951;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Financial Breakdown -->
    <tr>
      <td style="padding: 0 32px 24px 32px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 12px; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #666;">Bag Subtotal:</td>
            <td style="padding: 6px 0; text-align: right; color: #261B13;">${formatINR(order.subtotal)}</td>
          </tr>
          ${
            order.discount_amount > 0
              ? `<tr>
                  <td style="padding: 6px 0; color: #2E7D32;">Promotional Discount (${escapeHtml(order.coupon_code || "COUPON")}):</td>
                  <td style="padding: 6px 0; text-align: right; color: #2E7D32;">- ${formatINR(order.discount_amount)}</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #666;">Insured Courier Delivery:</td>
            <td style="padding: 6px 0; text-align: right; color: #261B13;">${order.shipping_fee === 0 ? "Complimentary" : formatINR(order.shipping_fee)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #866951; font-size: 12px;">Inclusive 5% GST (Taxable: ${formatINR(taxableAmount)}):</td>
            <td style="padding: 6px 0; text-align: right; color: #866951; font-size: 12px;">${formatINR(gstAmount)}</td>
          </tr>
          <tr style="border-top: 2px solid #261B13;">
            <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #261B13;">Grand Total:</td>
            <td style="padding: 12px 0; font-size: 16px; font-weight: 700; text-align: right; color: #261B13;">${formatINR(order.total_amount)}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Shipping Details -->
    <tr>
      <td style="padding: 20px 32px; background-color: #FAF7F2; border-top: 1px solid #EAE3D9;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951;">Delivery Address & Instructions</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #443E38;">
          <strong>${safeRecipient}</strong> (${safePhone})<br />
          ${safeAddress1}${safeAddress2 ? `, ${safeAddress2}` : ""}<br />
          ${safeCity}, ${safeState} - ${safePin}, India<br />
          <strong>Payment:</strong> ${safeMethod} (${safeStatus})<br />
          <strong>Special Notes:</strong> ${safeNotes}
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; text-align: center; font-size: 12px; color: #866951; border-top: 1px solid #EAE3D9;">
        <p style="margin: 0 0 4px 0;">Need concierge assistance? Reply directly to this email or call +91 98765 43210.</p>
        <p style="margin: 0; font-size: 11px; color: #A89887;">© ${new Date().getFullYear()} AVSARAA ATELIER. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
