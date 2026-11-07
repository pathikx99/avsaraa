/**
 * Webhook Deduplication and Security Utility
 * Eliminates duplicate webhook event processing and replay attacks.
 */

export const processedWebhooksMemory = new Set<string>();

/**
 * Checks if a webhook event ID has already been processed in memory.
 */
export function isWebhookProcessed(webhookId: string): boolean {
  return processedWebhooksMemory.has(webhookId);
}

/**
 * Marks a webhook event ID as processed in memory.
 */
export function markWebhookProcessed(webhookId: string): void {
  processedWebhooksMemory.add(webhookId);
}

/**
 * Clears processed webhooks (useful for unit testing).
 */
export function clearProcessedWebhooks(): void {
  processedWebhooksMemory.clear();
}
