import { z } from "zod";

// Shipment schemas
export const ListShipmentsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Number of records to return (max 1000)"),
  page: z.number().min(1).optional().describe("Page number for pagination"),
  batch_id: z.string().optional().describe("Filter by batch ID"),
  status: z
    .string()
    .optional()
    .describe("Filter by shipment status (e.g., pending, ready, inducted, in_transit, delivered, exception, cancelled)"),
  from_date: z
    .string()
    .optional()
    .describe("Filter shipments from this date (YYYY-MM-DD)"),
  to_date: z
    .string()
    .optional()
    .describe("Filter shipments to this date (YYYY-MM-DD)"),
  search: z
    .string()
    .optional()
    .describe(
      "Search term to find shipments (searches order_id, tracking, recipient name)"
    ),
});

export const GetShipmentSchema = z.object({
  id: z.string().describe("Shipment ID"),
});

export const CreateShipmentSchema = z.object({
  name: z.string().describe("Recipient name"),
  address_1: z.string().describe("Street address line 1"),
  address_2: z.string().optional().describe("Street address line 2"),
  city: z.string().describe("City"),
  province_code: z
    .string()
    .describe("Province/state code (e.g., ON, CA, NY)"),
  postal_code: z.string().describe("Postal/ZIP code"),
  country_code: z.string().describe("Country code (e.g., US, CA)"),
  phone: z.string().optional().describe("Recipient phone number"),
  email: z.string().optional().describe("Recipient email"),
  package_type: z
    .enum(["parcel", "thick_envelope", "flat_rate_envelope"])
    .optional()
    .describe("Package type"),
  size_unit: z.enum(["cm", "in"]).optional().describe("Size unit"),
  size_x: z.number().optional().describe("Package length"),
  size_y: z.number().optional().describe("Package width"),
  size_z: z.number().optional().describe("Package height"),
  weight_unit: z.enum(["g", "kg", "oz", "lb"]).optional().describe("Weight unit"),
  weight: z.number().optional().describe("Package weight"),
  description: z.string().optional().describe("Package contents description"),
  value: z.number().optional().describe("Declared value"),
  value_currency: z.enum(["CAD", "USD"]).optional().describe("Value currency"),
  order_id: z
    .string()
    .optional()
    .describe("External order ID (e.g., Shopify order number)"),
  order_store: z
    .string()
    .optional()
    .describe("E-commerce platform (e.g., shopify, etsy)"),
  postage_type: z.string().optional().describe("Postage service type"),
});

export const DeleteShipmentSchema = z.object({
  id: z.string().describe("Shipment ID to delete (must be unpaid)"),
});

export const BuyPostageSchema = z.object({
  id: z.string().describe("Shipment ID to purchase postage for"),
});

export const RefundShipmentSchema = z.object({
  id: z.string().describe("Shipment ID to request refund for"),
});

export const RefreshRatesSchema = z.object({
  id: z.string().describe("Shipment ID to refresh rates for"),
  size_x: z.number().optional().describe("Updated package length"),
  size_y: z.number().optional().describe("Updated package width"),
  size_z: z.number().optional().describe("Updated package height"),
  weight: z.number().optional().describe("Updated package weight"),
});

export const CountShipmentsSchema = z.object({
  status: z
    .string()
    .optional()
    .describe("Filter by status (e.g., pending, ready, inducted, in_transit, delivered)"),
});

// Batch schemas
export const ListBatchesSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Number of records to return (max 1000)"),
  page: z.number().min(1).optional().describe("Page number for pagination"),
  status: z
    .enum(["pending", "received"])
    .optional()
    .describe("Filter by batch status"),
});

export const CreateBatchSchema = z.object({
  description: z.string().optional().describe("Batch description/name"),
});

export const GetBatchSchema = z.object({
  id: z.string().describe("Batch ID"),
});

export const DeleteBatchSchema = z.object({
  id: z.string().describe("Batch ID to delete (must be empty)"),
});

export const AddToBatchSchema = z.object({
  batch_id: z.string().describe("Batch ID to add shipments to"),
  shipment_ids: z
    .array(z.string())
    .describe("Array of shipment IDs to add to the batch"),
});

export const RemoveFromBatchSchema = z.object({
  shipment_ids: z
    .array(z.string())
    .describe("Array of shipment IDs to remove from their batches"),
});

export const CountBatchesSchema = z.object({
  status: z
    .enum(["pending", "received"])
    .optional()
    .describe("Filter by status"),
});

// Returns schemas
export const ListReturnsSchema = z.object({
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Number of records to return (max 1000)"),
  page: z.number().min(1).optional().describe("Page number for pagination"),
  status: z.string().optional().describe("Filter by return status"),
  reason: z.string().optional().describe("Filter by return reason"),
});

// Tracking schemas
export const TrackShipmentSchema = z.object({
  id: z.string().describe("Shipment ID to get tracking for"),
});
