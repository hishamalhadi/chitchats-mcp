import { client } from "../client.js";
import type { z } from "zod";
import type {
  ListBatchesSchema,
  CreateBatchSchema,
  GetBatchSchema,
  DeleteBatchSchema,
  AddToBatchSchema,
  RemoveFromBatchSchema,
  CountBatchesSchema,
} from "../schemas.js";

interface Batch {
  id: string;
  status: string;
  description?: string;
  shipment_count?: number;
  created_at: string;
}

export async function listBatches(
  params: z.infer<typeof ListBatchesSchema>
): Promise<string> {
  const queryParams = new URLSearchParams();

  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.status) queryParams.set("status", params.status);

  const query = queryParams.toString();
  const endpoint = `/batches${query ? `?${query}` : ""}`;

  const response = await client.get<Batch[]>(endpoint);

  if (response.error) {
    return `Error listing batches: ${response.error}`;
  }

  const batches = response.data || [];

  if (batches.length === 0) {
    return "No batches found.";
  }

  const formatted = batches.map((b) => {
    const lines = [`ID: ${b.id}`, `Status: ${b.status}`];

    if (b.description) lines.push(`Description: ${b.description}`);
    if (b.shipment_count !== undefined)
      lines.push(`Shipments: ${b.shipment_count}`);
    lines.push(`Created: ${b.created_at}`);

    return lines.join("\n");
  });

  return `Found ${batches.length} batch(es):\n\n${formatted.join("\n\n---\n\n")}`;
}

export async function createBatch(
  params: z.infer<typeof CreateBatchSchema>
): Promise<string> {
  const body: Record<string, unknown> = {};
  if (params.description) body.description = params.description;

  const response = await client.post<{ batch: Batch }>("/batches", body);

  if (response.error) {
    return `Error creating batch: ${response.error}`;
  }

  const b = response.data?.batch;
  if (!b) {
    return "Batch created but no data returned.";
  }

  return `Batch created successfully!\n\nID: ${b.id}\nStatus: ${b.status}${b.description ? `\nDescription: ${b.description}` : ""}`;
}

export async function getBatch(
  params: z.infer<typeof GetBatchSchema>
): Promise<string> {
  const response = await client.get<{ batch: Batch }>(`/batches/${params.id}`);

  if (response.error) {
    return `Error getting batch: ${response.error}`;
  }

  const b = response.data?.batch;
  if (!b) {
    return `Batch ${params.id} not found.`;
  }

  const lines = [
    `## Batch ${b.id}`,
    "",
    `**Status:** ${b.status}`,
  ];

  if (b.description) lines.push(`**Description:** ${b.description}`);
  if (b.shipment_count !== undefined)
    lines.push(`**Shipments:** ${b.shipment_count}`);
  lines.push(`**Created:** ${b.created_at}`);

  return lines.join("\n");
}

export async function deleteBatch(
  params: z.infer<typeof DeleteBatchSchema>
): Promise<string> {
  const response = await client.delete(`/batches/${params.id}`);

  if (response.error) {
    return `Error deleting batch: ${response.error}. Note: Only empty batches can be deleted.`;
  }

  return `Batch ${params.id} deleted successfully.`;
}

export async function addToBatch(
  params: z.infer<typeof AddToBatchSchema>
): Promise<string> {
  const body = {
    batch_id: params.batch_id,
    shipment_ids: params.shipment_ids,
  };

  const response = await client.patch("/shipments/add_to_batch", body);

  if (response.error) {
    return `Error adding shipments to batch: ${response.error}`;
  }

  return `Successfully added ${params.shipment_ids.length} shipment(s) to batch ${params.batch_id}.`;
}

export async function removeFromBatch(
  params: z.infer<typeof RemoveFromBatchSchema>
): Promise<string> {
  const body = {
    shipment_ids: params.shipment_ids,
  };

  const response = await client.patch("/shipments/remove_from_batch", body);

  if (response.error) {
    return `Error removing shipments from batch: ${response.error}`;
  }

  return `Successfully removed ${params.shipment_ids.length} shipment(s) from their batches.`;
}

export async function countBatches(
  params: z.infer<typeof CountBatchesSchema>
): Promise<string> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.set("status", params.status);

  const query = queryParams.toString();
  const endpoint = `/batches/count${query ? `?${query}` : ""}`;

  const response = await client.get<{ count: number }>(endpoint);

  if (response.error) {
    return `Error counting batches: ${response.error}`;
  }

  const count = response.data?.count ?? 0;
  const statusText = params.status ? ` with status "${params.status}"` : "";

  return `Total batches${statusText}: ${count}`;
}
