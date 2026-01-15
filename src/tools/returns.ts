import { client } from "../client.js";
import type { z } from "zod";
import type { ListReturnsSchema } from "../schemas.js";

interface Return {
  id: string;
  status: string;
  reason?: string;
  shipment_id?: string;
  created_at: string;
}

export async function listReturns(
  params: z.infer<typeof ListReturnsSchema>
): Promise<string> {
  const queryParams = new URLSearchParams();

  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.status) queryParams.set("status", params.status);
  if (params.reason) queryParams.set("reason", params.reason);

  const query = queryParams.toString();
  const endpoint = `/returns${query ? `?${query}` : ""}`;

  const response = await client.get<Return[]>(endpoint);

  if (response.error) {
    return `Error listing returns: ${response.error}`;
  }

  const returns = response.data || [];

  if (returns.length === 0) {
    return "No returns found matching your criteria.";
  }

  const formatted = returns.map((r) => {
    const lines = [`ID: ${r.id}`, `Status: ${r.status}`];

    if (r.reason) lines.push(`Reason: ${r.reason}`);
    if (r.shipment_id) lines.push(`Shipment ID: ${r.shipment_id}`);
    lines.push(`Created: ${r.created_at}`);

    return lines.join("\n");
  });

  return `Found ${returns.length} return(s):\n\n${formatted.join("\n\n---\n\n")}`;
}
