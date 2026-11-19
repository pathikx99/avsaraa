/**
 * Fulfillment & Carrier Webhook Endpoint
 * Neutral URL path designed to comply with carrier restrictions (e.g. Shiprocket policy
 * prohibiting keywords like 'shiprocket', 'sr', 'kartrocket', or 'kr' in the webhook URL).
 */
export { GET, POST } from "@/app/api/shiprocket/webhook/route";
