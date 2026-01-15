import { client } from "../client.js";
import type { z } from "zod";
import type { TrackShipmentSchema } from "../schemas.js";

interface TrackingEvent {
  date: string;
  description: string;
  location?: string;
}

interface TrackingInfo {
  shipment_id: string;
  status: string;
  carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  events?: TrackingEvent[];
}

export async function trackShipment(
  params: z.infer<typeof TrackShipmentSchema>
): Promise<string> {
  const response = await client.getPublicTracking(params.id);

  if (response.error) {
    return `Error getting tracking: ${response.error}`;
  }

  const tracking = response.data as TrackingInfo | undefined;
  if (!tracking) {
    return `No tracking information found for shipment ${params.id}.`;
  }

  const lines = [
    `## Tracking for Shipment ${params.id}`,
    "",
    `**Status:** ${tracking.status || "Unknown"}`,
  ];

  if (tracking.carrier) lines.push(`**Carrier:** ${tracking.carrier}`);
  if (tracking.tracking_number)
    lines.push(`**Tracking Number:** ${tracking.tracking_number}`);
  if (tracking.estimated_delivery)
    lines.push(`**Estimated Delivery:** ${tracking.estimated_delivery}`);

  if (tracking.events && tracking.events.length > 0) {
    lines.push("", "### Tracking History");
    for (const event of tracking.events) {
      const location = event.location ? ` (${event.location})` : "";
      lines.push(`- **${event.date}:** ${event.description}${location}`);
    }
  }

  return lines.join("\n");
}
