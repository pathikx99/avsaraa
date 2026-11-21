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
 * Determines whether the shipping destination is within Gujarat (Intra-state)
 * or Outside Gujarat (Inter-state) for Indian GST calculation.
 */
export function isGujaratSupply(order: Order): boolean {
  const state = (order.shipping_address_snapshot?.state || "").toLowerCase().trim();
  const pin = (order.shipping_address_snapshot?.postal_code || "").trim();
  if (state.includes("gujarat")) return true;
  if (/^3[6-9]\d{4}$/.test(pin)) return true;
  return false;
}

/**
 * Generates official, statutory Indian GST Tax Invoice HTML email for customer orders.
 * Fully compliant with Rule 46 of CGST Rules, 2017.
 */
export function generateCustomerTaxInvoiceEmailHtml(order: Order): string {
  const safeOrderNumber = escapeHtml(order.order_number);
  const safeRecipient = escapeHtml(order.shipping_address_snapshot.recipient_name);
  const safePhone = escapeHtml(order.shipping_address_snapshot.phone_number);
  const safeEmail = escapeHtml(order.shipping_address_snapshot.email || "");
  const safeAddress1 = escapeHtml(order.shipping_address_snapshot.address_line1);
  const safeAddress2 = escapeHtml(order.shipping_address_snapshot.address_line2 || "");
  const safeLandmark = escapeHtml(order.shipping_address_snapshot.landmark || "");
  const safeCity = escapeHtml(order.shipping_address_snapshot.city);
  const safeState = escapeHtml(order.shipping_address_snapshot.state);
  const safePin = escapeHtml(order.shipping_address_snapshot.postal_code);
  const safeMethod = escapeHtml(order.payment_method);
  const safeStatus = escapeHtml(order.payment_status);
  const safeNotes = escapeHtml(order.notes || "None");

  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const invoiceNo = `INV-${new Date().getFullYear()}-${safeOrderNumber.replace(/[^A-Za-z0-9]/g, "").slice(-6)}`;

  const isIntraState = isGujaratSupply(order);
  const netDiscounted = Math.max(0, order.subtotal - (order.discount_amount || 0));
  const { gstAmount, taxableAmount } = computeInclusiveGst(netDiscounted);

  const cgstAmount = isIntraState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((gstAmount - cgstAmount) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? gstAmount : 0;

  const itemsHtml = (order.order_items || [])
    .map((item, idx) => {
      const name = escapeHtml(item.product_name);
      const size = escapeHtml(item.size || "Standard Size");
      const color = escapeHtml(item.color || "Default");
      const qty = Number(item.quantity) || 1;
      const unit = formatINR(item.unit_price);
      const total = formatINR(item.total_price);
      return `
        <tr style="border-bottom: 1px solid #EAE3D9;">
          <td style="padding: 12px 10px; font-size: 13px; color: #55504A; text-align: center;">${idx + 1}</td>
          <td style="padding: 12px 14px; font-size: 13px; color: #261B13;">
            <strong style="color: #261B13;">${name}</strong><br />
            <span style="font-size: 11px; color: #866951;">Variant: ${size} | Tone: ${color}</span>
          </td>
          <td style="padding: 12px 10px; font-size: 12px; color: #6E5B4E; text-align: center;">5208</td>
          <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #261B13;">${qty}</td>
          <td style="padding: 12px 14px; font-size: 13px; text-align: right; color: #261B13;">${unit}</td>
          <td style="padding: 12px 14px; font-size: 13px; text-align: right; color: #261B13; font-weight: 600;">${total}</td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Avsaraa Tax Invoice - ${safeOrderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px 12px; color: #261B13; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 660px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(38,27,19,0.08); border: 1px solid #EAE3D9;">
    
    <!-- Top Brand Header -->
    <tr>
      <td style="background-color: #261B13; padding: 32px 36px 28px; text-align: center;">
        <h1 style="color: #FAF7F2; font-size: 26px; letter-spacing: 0.18em; margin: 0; font-weight: 300; text-transform: uppercase;">AVSARAA</h1>
        <p style="color: #D4BEAA; font-size: 11px; letter-spacing: 0.22em; margin: 6px 0 0 0; text-transform: uppercase;">Surat Handloom Atelier · Wear The Moment</p>
      </td>
    </tr>

    <!-- Invoice Header & Statutory Identity -->
    <tr>
      <td style="padding: 24px 32px 16px; border-bottom: 2px solid #FAF7F2;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top" style="width: 55%; font-size: 12px; line-height: 1.6; color: #55504A;">
              <strong style="font-size: 13px; color: #261B13; text-transform: uppercase; letter-spacing: 0.05em;">Seller & Registered Atelier</strong><br />
              <strong>AVSARAA LOOMS & ATELIER PVT. LTD.</strong><br />
              Ring Road Textile Hub, Surat, Gujarat — 395002<br />
              <strong>GSTIN:</strong> <span style="color: #261B13; font-weight: 600;">24AAACA0000A1Z5</span><br />
              <strong>State:</strong> Gujarat (State Code: 24)<br />
              <strong>CIN / MSME:</strong> GJ-24-TEXT-2026-00918
            </td>
            <td valign="top" style="width: 45%; text-align: right; font-size: 12px; line-height: 1.6; color: #55504A;">
              <div style="display: inline-block; text-align: right; background-color: #FAF7F2; padding: 10px 14px; border-radius: 8px; border: 1px solid #EAE3D9;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951; font-weight: 700; display: block;">ORIGINAL TAX INVOICE</span>
                <strong style="font-size: 14px; color: #261B13;">${invoiceNo}</strong><br />
                <span style="font-size: 11px; color: #6E5B4E;">Order: #${safeOrderNumber}</span><br />
                <span style="font-size: 11px; color: #6E5B4E;">Date: ${orderDate}</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer & Shipping Information -->
    <tr>
      <td style="padding: 20px 32px 16px; background-color: #FCFAF8; border-bottom: 1px solid #EAE3D9;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top" style="width: 50%; font-size: 12px; line-height: 1.6; color: #55504A; padding-right: 12px;">
              <strong style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951;">BILL TO / RECIPIENT</strong><br />
              <strong style="font-size: 14px; color: #261B13;">${safeRecipient}</strong><br />
              ${safeEmail ? `Email: ${safeEmail}<br />` : ""}
              Phone: ${safePhone}<br />
              Place of Supply: ${safeState} (PIN: ${safePin})
            </td>
            <td valign="top" style="width: 50%; font-size: 12px; line-height: 1.6; color: #55504A; padding-left: 12px; border-left: 1px solid #EAE3D9;">
              <strong style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951;">SHIP TO DESTINATION</strong><br />
              ${safeAddress1}${safeAddress2 ? `, ${safeAddress2}` : ""}<br />
              ${safeLandmark ? `Landmark: ${safeLandmark}<br />` : ""}
              ${safeCity}, ${safeState} — ${safePin}, India<br />
              <strong>Payment:</strong> ${safeMethod} (${safeStatus})
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Line Items Table -->
    <tr>
      <td style="padding: 16px 32px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #261B13; color: #FAF7F2;">
              <th style="padding: 10px 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">#</th>
              <th style="padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">Item Description</th>
              <th style="padding: 10px 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">HSN</th>
              <th style="padding: 10px 10px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">Qty</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">Unit Price</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Financial Breakdown & GST Split -->
    <tr>
      <td style="padding: 0 32px 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top" style="width: 50%; padding-top: 10px; font-size: 12px; color: #6E5B4E; line-height: 1.6;">
              <strong style="color: #261B13;">Tax Note:</strong><br />
              All prices include statutory 5% Goods and Services Tax (GST) as applicable under Indian HSN 5208 (Woven Handloom Silk).
              ${
                order.notes && order.notes !== "None"
                  ? `<br /><br /><strong>Order Instructions:</strong><br />${safeNotes}`
                  : ""
              }
            </td>
            <td valign="top" style="width: 50%;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px;">
                <tr>
                  <td style="padding: 5px 0; color: #55504A;">Gross Item Subtotal:</td>
                  <td style="padding: 5px 0; text-align: right; color: #261B13;">${formatINR(order.subtotal)}</td>
                </tr>
                ${
                  order.discount_amount > 0
                    ? `<tr>
                        <td style="padding: 5px 0; color: #2E7D32;">Promotional Coupon (${escapeHtml(order.coupon_code || "DISCOUNT")}):</td>
                        <td style="padding: 5px 0; text-align: right; color: #2E7D32; font-weight: 600;">- ${formatINR(order.discount_amount)}</td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 5px 0; color: #55504A;">Taxable Value:</td>
                  <td style="padding: 5px 0; text-align: right; color: #261B13;">${formatINR(taxableAmount)}</td>
                </tr>
                ${
                  isIntraState
                    ? `
                    <tr>
                      <td style="padding: 4px 0; color: #866951; font-size: 12px;">CGST (2.5%):</td>
                      <td style="padding: 4px 0; text-align: right; color: #866951; font-size: 12px;">${formatINR(cgstAmount)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #866951; font-size: 12px;">SGST (2.5%):</td>
                      <td style="padding: 4px 0; text-align: right; color: #866951; font-size: 12px;">${formatINR(sgstAmount)}</td>
                    </tr>
                    `
                    : `
                    <tr>
                      <td style="padding: 4px 0; color: #866951; font-size: 12px;">IGST (5.0%):</td>
                      <td style="padding: 4px 0; text-align: right; color: #866951; font-size: 12px;">${formatINR(igstAmount)}</td>
                    </tr>
                    `
                }
                <tr>
                  <td style="padding: 5px 0; color: #55504A;">Insured Courier Logistics:</td>
                  <td style="padding: 5px 0; text-align: right; color: #261B13;">${order.shipping_fee === 0 ? "Complimentary" : formatINR(order.shipping_fee)}</td>
                </tr>
                <tr style="border-top: 2px solid #261B13;">
                  <td style="padding: 10px 0; font-size: 15px; font-weight: 700; color: #261B13;">Grand Total:</td>
                  <td style="padding: 10px 0; font-size: 16px; font-weight: 700; text-align: right; color: #261B13;">${formatINR(order.total_amount)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Authentication & Signatory Seal -->
    <tr>
      <td style="padding: 18px 32px; background-color: #FAF7F2; border-top: 1px solid #EAE3D9;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 11px; color: #866951; line-height: 1.5;">
              ✓ Handcrafted in Surat with certified silk mark authenticity.<br />
              ✓ 7-Day Hassle-Free Exchange guarantee.<br />
              <em>Computer-generated tax invoice issued in accordance with Rule 46 of CGST Rules, 2017.</em>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-block; text-align: center;">
                <span style="font-size: 11px; color: #866951; display: block; margin-bottom: 4px;">For AVSARAA ATELIER</span>
                <div style="display: inline-block; padding: 4px 10px; border: 1px dashed #A97C50; border-radius: 4px; font-size: 10px; font-weight: 700; color: #A97C50; letter-spacing: 0.1em; text-transform: uppercase;">
                  [AUTHORIZED SIGNATORY]
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; text-align: center; font-size: 12px; color: #866951; border-top: 1px solid #EAE3D9;">
        <p style="margin: 0 0 4px 0;">Concierge Support: <a href="mailto:support@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: none;">support@avsaraa.in</a> | Order Inquiries: <a href="mailto:order@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: none;">order@avsaraa.in</a></p>
        <p style="margin: 0; font-size: 11px; color: #A89887;">© ${new Date().getFullYear()} AVSARAA. All rights reserved.</p>
      </td>
    </tr>

  </table>
</body>
</html>
  `;
}

/**
 * Backward-compatible alias for customer order confirmation email.
 */
export function generateOrderConfirmationEmailHtml(order: Order): string {
  return generateCustomerTaxInvoiceEmailHtml(order);
}

/**
 * Generates an urgent, actionable HTML notification email for the Store Admin.
 * Sent immediately upon order placement or payment capture.
 */
export function generateAdminOrderAlertEmailHtml(order: Order): string {
  const safeOrderNumber = escapeHtml(order.order_number);
  const safeRecipient = escapeHtml(order.shipping_address_snapshot.recipient_name);
  const rawPhone = String(order.shipping_address_snapshot.phone_number || "").replace(/[^0-9]/g, "");
  const safePhone = escapeHtml(order.shipping_address_snapshot.phone_number);
  const safeEmail = escapeHtml(order.shipping_address_snapshot.email || "Not provided");
  const safeAddress1 = escapeHtml(order.shipping_address_snapshot.address_line1);
  const safeAddress2 = escapeHtml(order.shipping_address_snapshot.address_line2 || "");
  const safeLandmark = escapeHtml(order.shipping_address_snapshot.landmark || "");
  const safeCity = escapeHtml(order.shipping_address_snapshot.city);
  const safeState = escapeHtml(order.shipping_address_snapshot.state);
  const safePin = escapeHtml(order.shipping_address_snapshot.postal_code);
  const safeMethod = escapeHtml(order.payment_method);
  const safeStatus = escapeHtml(order.payment_status);
  const safeNotes = escapeHtml(order.notes || "None");
  const isGuest = Boolean(order.shipping_address_snapshot.is_guest);

  const courierAdvice = safePin.startsWith("395")
    ? "Surat Local Atelier Hand-Delivery"
    : "Blue Dart Express Gujarat";

  const itemsList = (order.order_items || [])
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${escapeHtml(item.product_name)}</strong> &times; ${item.quantity} 
        — <span style="color: #6E5B4E;">Variant: ${escapeHtml(item.size || "Standard")} | Color: ${escapeHtml(item.color || "Default")}</span>
        <br /><span style="font-size: 12px; color: #261B13; font-weight: 600;">Total: ${formatINR(item.total_price)}</span>
      </li>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Admin Order Alert - ${safeOrderNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F0EB; margin: 0; padding: 24px 12px; color: #261B13;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 10px; overflow: hidden; border: 1px solid #DCD4CA;">
    
    <!-- Urgent Admin Banner -->
    <tr>
      <td style="background-color: #8B2500; padding: 20px 28px; color: #FFFFFF;">
        <span style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; opacity: 0.9;">Avsaraa Dispatch System · Urgent Action</span>
        <h1 style="font-size: 20px; margin: 6px 0 0; font-weight: 600;">🚨 New Order Received: #${safeOrderNumber}</h1>
      </td>
    </tr>

    <!-- Core Metrics -->
    <tr>
      <td style="padding: 24px 28px 12px; border-bottom: 1px solid #EFEAE3;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 13px; color: #6E5B4E;">
              <strong>Order Value:</strong> <span style="font-size: 18px; font-weight: 700; color: #261B13;">${formatINR(order.total_amount)}</span><br />
              <strong>Payment Gateway:</strong> ${safeMethod}<br />
              <strong>Payment Status:</strong> <span style="color: ${safeStatus === "Paid" ? "#2E7D32" : "#B26A00"}; font-weight: 700;">● ${safeStatus}</span><br />
              <strong>Customer Tier:</strong> ${isGuest ? "Guest Checkout" : "Registered Member"}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Customer & Destination Details -->
    <tr>
      <td style="padding: 16px 28px; background-color: #FAF7F2; border-bottom: 1px solid #EFEAE3; font-size: 13px; line-height: 1.6;">
        <strong style="color: #866951; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">Customer Information</strong><br />
        <strong>Recipient:</strong> ${safeRecipient}<br />
        <strong>Phone:</strong> <a href="tel:${rawPhone}" style="color: #261B13; font-weight: 600;">${safePhone}</a><br />
        <strong>Email:</strong> ${safeEmail}<br />
        <br />
        <strong style="color: #866951; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">Delivery Address</strong><br />
        ${safeAddress1}${safeAddress2 ? `, ${safeAddress2}` : ""}<br />
        ${safeLandmark ? `Landmark: ${safeLandmark}<br />` : ""}
        ${safeCity}, ${safeState} — <strong>${safePin}</strong><br />
        <strong>Recommended Courier:</strong> ${courierAdvice}
      </td>
    </tr>

    <!-- Ordered Items Checklist -->
    <tr>
      <td style="padding: 16px 28px; border-bottom: 1px solid #EFEAE3;">
        <strong style="color: #866951; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">Packing Slip Items</strong>
        <ul style="padding-left: 20px; margin: 8px 0 0; font-size: 13px; line-height: 1.6;">
          ${itemsList}
        </ul>
        ${
          order.notes && order.notes !== "None"
            ? `<div style="margin-top: 12px; padding: 10px; background-color: #FFF9E6; border: 1px solid #FFE082; border-radius: 6px; font-size: 12px; color: #795548;">
                <strong>Special Customer Note:</strong> ${safeNotes}
               </div>`
            : ""
        }
      </td>
    </tr>

    <!-- Admin Actions -->
    <tr>
      <td style="padding: 20px 28px; text-align: center; background-color: #FFFFFF;">
        <p style="margin: 0 0 12px; font-size: 12px; color: #6E5B4E;">
          Please prepare and dispatch within 24 hours to meet estimated delivery targets.
        </p>
        <a href="https://avsaraa.com/admin" target="_blank" style="display: inline-block; background-color: #261B13; color: #FAF7F2; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
          Open Order in Admin Portal →
        </a>
      </td>
    </tr>

  </table>
</body>
</html>
  `;
}

export interface InquiryAcknowledgementDetails {
  customerName: string;
  customerEmail?: string;
  subject?: string;
  message: string;
  inquiryId?: string;
}

/**
 * Generates brand-aligned enquiry acknowledgement HTML email for customers.
 * Sent from support@avsaraa.in when a customer submits a contact inquiry or bespoke question.
 */
export function generateInquiryAcknowledgementEmailHtml(details: InquiryAcknowledgementDetails): string {
  const safeName = escapeHtml(details.customerName || "Valued Customer");
  const safeSubject = escapeHtml(details.subject || "Customer Inquiry");
  const safeMessage = escapeHtml(details.message || "").replace(/\n/g, "<br />");
  const safeRef = details.inquiryId ? escapeHtml(details.inquiryId.slice(0, 8).toUpperCase()) : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Received · AVSARAA Support</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F5F2EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #261B13; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #FAF7F2; border-radius: 8px; border: 1px solid #EAE3D9; overflow: hidden; box-shadow: 0 4px 16px rgba(38, 27, 19, 0.05);">
    
    <!-- Top Header & Monogram -->
    <tr>
      <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 2px solid #C5A265; background-color: #261B13;">
        <span style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 4px; color: #FAF7F2; text-transform: uppercase; display: block;">AVSARAA</span>
        <span style="display: block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C4AB94; margin-top: 4px;">Atelier & Concierge Support</span>
      </td>
    </tr>

    <!-- Badge & Hero Title -->
    <tr>
      <td style="padding: 32px 32px 16px 32px; text-align: center;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #F3EBDD; border: 1px solid #DFD2C0; border-radius: 16px; font-size: 11px; font-weight: 600; color: #866951; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
          ✦ Inquiry Acknowledged ✦
        </div>
        <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #261B13; margin: 0 0 10px 0; line-height: 1.3;">
          We Have Received Your Inquiry
        </h1>
        <p style="font-size: 14px; color: #6E5C4E; line-height: 1.6; margin: 0 auto; max-width: 500px;">
          Dear ${safeName}, thank you for reaching out to Avsaraa. Our concierge support team has received your message and will review it promptly.
        </p>
      </td>
    </tr>

    <!-- Inquiry Details Box -->
    <tr>
      <td style="padding: 12px 32px 24px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #FFFFFF; border: 1px solid #EAE3D9; border-radius: 6px; padding: 20px;">
          ${
            safeRef
              ? `<tr>
            <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951; font-weight: 700; padding-bottom: 6px;">Reference Number:</td>
            <td style="font-size: 13px; font-weight: 600; color: #261B13; text-align: right; padding-bottom: 6px;">#INQ-${safeRef}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951; font-weight: 700; padding-bottom: 6px;">Subject:</td>
            <td style="font-size: 13px; font-weight: 600; color: #261B13; text-align: right; padding-bottom: 6px;">${safeSubject}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 12px; border-top: 1px solid #F5F2EB;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #866951; font-weight: 700; display: block; margin-bottom: 6px;">Your Message:</span>
              <div style="font-size: 13px; color: #4A3A2F; background-color: #FAF7F2; border-left: 3px solid #C5A265; padding: 12px 14px; line-height: 1.6; font-style: italic;">
                ${safeMessage}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Resolution Commitment Note -->
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <div style="background-color: #F8F5EE; border: 1px dashed #D6C7B8; border-radius: 6px; padding: 16px; font-size: 13px; color: #5C4B3E; line-height: 1.6;">
          <strong style="color: #261B13;">What to expect next:</strong>
          <p style="margin: 6px 0 0 0;">
            A dedicated concierge representative will review your enquiry and respond to you within <strong>24 to 48 business hours</strong>. If you have additional details or images to share, simply reply directly to this email at <a href="mailto:support@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: underline;">support@avsaraa.in</a>.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; text-align: center; font-size: 12px; color: #866951; border-top: 1px solid #EAE3D9; background-color: #FAF7F2;">
        <p style="margin: 0 0 4px 0;">Customer Care & Support: <a href="mailto:support@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: none;">support@avsaraa.in</a></p>
        <p style="margin: 0; font-size: 11px; color: #A89887;">© ${new Date().getFullYear()} AVSARAA Atelier. All rights reserved.</p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

export interface EmailVerificationDetails {
  to?: string;
  otp?: string;
  verificationUrl?: string;
  name?: string;
}

/**
 * Generates brand-aligned email verification HTML email.
 * Sent from support@avsaraa.in when verifying customer email addresses or login OTPs.
 */
export function generateEmailVerificationHtml(details: EmailVerificationDetails): string {
  const safeName = escapeHtml(details.name || "Valued Patron");
  const safeOtp = details.otp ? escapeHtml(details.otp) : null;
  const safeUrl = details.verificationUrl ? escapeHtml(details.verificationUrl) : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email · AVSARAA Support</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F5F2EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #261B13; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #FAF7F2; border-radius: 8px; border: 1px solid #EAE3D9; overflow: hidden; box-shadow: 0 4px 16px rgba(38, 27, 19, 0.05);">
    
    <!-- Top Header & Monogram -->
    <tr>
      <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 2px solid #C5A265; background-color: #261B13;">
        <span style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 4px; color: #FAF7F2; text-transform: uppercase; display: block;">AVSARAA</span>
        <span style="display: block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C4AB94; margin-top: 4px;">Atelier & Concierge Support</span>
      </td>
    </tr>

    <!-- Badge & Hero Title -->
    <tr>
      <td style="padding: 32px 32px 16px 32px; text-align: center;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #F3EBDD; border: 1px solid #DFD2C0; border-radius: 16px; font-size: 11px; font-weight: 600; color: #866951; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
          ✦ EMAIL VERIFICATION ✦
        </div>
        <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; color: #261B13; margin: 0 0 10px 0; line-height: 1.3;">
          Verify Your Email Address
        </h1>
        <p style="font-size: 14px; color: #6E5C4E; line-height: 1.6; margin: 0 auto; max-width: 500px;">
          Dear ${safeName}, please use the verification details below to verify your email address with Avsaraa Atelier.
        </p>
      </td>
    </tr>

    <!-- OTP Code Display Card -->
    ${
      safeOtp
        ? `<tr>
      <td style="padding: 12px 32px 20px 32px; text-align: center;">
        <div style="background-color: #FFFFFF; border: 2px dashed #C5A265; border-radius: 8px; padding: 24px; max-width: 380px; margin: 0 auto;">
          <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #866951; font-weight: 700; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #261B13; padding: 6px 0;">
            ${safeOtp}
          </div>
          <span style="display: block; font-size: 12px; color: #8E7D70; margin-top: 8px;">Valid for 5 minutes</span>
        </div>
      </td>
    </tr>`
        : ""
    }

    <!-- Verification Button (if link provided) -->
    ${
      safeUrl
        ? `<tr>
      <td style="padding: 12px 32px 20px 32px; text-align: center;">
        <a href="${safeUrl}" target="_blank" style="display: inline-block; background-color: #261B13; color: #FAF7F2; text-decoration: none; padding: 14px 28px; border-radius: 28px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
          Verify Email Address →
        </a>
      </td>
    </tr>`
        : ""
    }

    <!-- Security Notice -->
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <div style="background-color: #F8F5EE; border: 1px solid #E8DED3; border-radius: 6px; padding: 14px 18px; font-size: 12.5px; color: #6E5C4E; line-height: 1.6;">
          <strong>Security Notice:</strong>
          <p style="margin: 4px 0 0 0;">
            This verification code was requested for your Avsaraa account. If you did not initiate this request, please disregard this email or contact concierge support immediately at <a href="mailto:support@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: underline;">support@avsaraa.in</a>.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; text-align: center; font-size: 12px; color: #866951; border-top: 1px solid #EAE3D9; background-color: #FAF7F2;">
        <p style="margin: 0 0 4px 0;">Concierge Support: <a href="mailto:support@avsaraa.in" style="color: #261B13; font-weight: 600; text-decoration: none;">support@avsaraa.in</a></p>
        <p style="margin: 0; font-size: 11px; color: #A89887;">© ${new Date().getFullYear()} AVSARAA Atelier. All rights reserved.</p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}
