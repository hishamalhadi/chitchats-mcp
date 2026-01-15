#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";

// Load environment variables
config();

// Import schemas
import {
  ListShipmentsSchema,
  GetShipmentSchema,
  CreateShipmentSchema,
  DeleteShipmentSchema,
  BuyPostageSchema,
  RefundShipmentSchema,
  RefreshRatesSchema,
  CountShipmentsSchema,
  ListBatchesSchema,
  CreateBatchSchema,
  GetBatchSchema,
  DeleteBatchSchema,
  AddToBatchSchema,
  RemoveFromBatchSchema,
  CountBatchesSchema,
  ListReturnsSchema,
  TrackShipmentSchema,
} from "./schemas.js";

// Import tool handlers
import {
  listShipments,
  getShipment,
  getShipmentRates,
  getShipmentLabels,
  getShipmentLineItems,
  createShipment,
  deleteShipment,
  buyPostage,
  refundShipment,
  refreshRates,
  countShipments,
} from "./tools/shipments.js";

import {
  listBatches,
  createBatch,
  getBatch,
  deleteBatch,
  addToBatch,
  removeFromBatch,
  countBatches,
} from "./tools/batches.js";

import { listReturns } from "./tools/returns.js";
import { trackShipment } from "./tools/tracking.js";

// Create server
const server = new Server(
  {
    name: "chitchats-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
const tools = [
  // Shipment tools
  {
    name: "chitchats_list_shipments",
    description:
      "List and search shipments with filters. Use this to find shipments by order ID, status, date range, or batch. Supports pagination.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Number of records to return (max 1000)",
        },
        page: {
          type: "number",
          description: "Page number for pagination",
        },
        batch_id: {
          type: "string",
          description: "Filter by batch ID",
        },
        status: {
          type: "string",
          description: "Filter by status (pending, ready, inducted, in_transit, delivered, exception, cancelled)",
        },
        from_date: {
          type: "string",
          description: "Filter shipments from this date (YYYY-MM-DD)",
        },
        to_date: {
          type: "string",
          description: "Filter shipments to this date (YYYY-MM-DD)",
        },
        search: {
          type: "string",
          description:
            "Search term (searches order_id, tracking, recipient name)",
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_get_shipment",
    description:
      "Get full details of a specific shipment by ID, including cost breakdown, tracking info, and recipient details.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Shipment ID",
        },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_get_rates",
    description:
      "Get all available shipping rates for a shipment, including costs, delivery times, and carrier options.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_get_labels",
    description:
      "Get label download URLs (PNG, PDF, ZPL) for a shipment with purchased postage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_get_line_items",
    description:
      "Get line items for a shipment including HS tariff codes, SKUs, quantities, weights, origin countries, and manufacturer info.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_create_shipment",
    description:
      "Create a new shipment with recipient address, package dimensions, and optional order reference.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Recipient name" },
        address_1: { type: "string", description: "Street address line 1" },
        address_2: { type: "string", description: "Street address line 2" },
        city: { type: "string", description: "City" },
        province_code: {
          type: "string",
          description: "Province/state code (e.g., ON, CA, NY)",
        },
        postal_code: { type: "string", description: "Postal/ZIP code" },
        country_code: {
          type: "string",
          description: "Country code (e.g., US, CA)",
        },
        phone: { type: "string", description: "Recipient phone" },
        email: { type: "string", description: "Recipient email" },
        package_type: {
          type: "string",
          enum: ["parcel", "thick_envelope", "flat_rate_envelope"],
          description: "Package type",
        },
        size_unit: { type: "string", enum: ["cm", "in"], description: "Size unit" },
        size_x: { type: "number", description: "Package length" },
        size_y: { type: "number", description: "Package width" },
        size_z: { type: "number", description: "Package height" },
        weight_unit: {
          type: "string",
          enum: ["g", "kg", "oz", "lb"],
          description: "Weight unit",
        },
        weight: { type: "number", description: "Package weight" },
        description: { type: "string", description: "Contents description" },
        value: { type: "number", description: "Declared value" },
        value_currency: {
          type: "string",
          enum: ["CAD", "USD"],
          description: "Value currency",
        },
        order_id: { type: "string", description: "External order ID (e.g., Shopify)" },
        order_store: { type: "string", description: "E-commerce platform" },
        postage_type: { type: "string", description: "Postage service type" },
      },
      required: [
        "name",
        "address_1",
        "city",
        "province_code",
        "postal_code",
        "country_code",
      ],
    },
  },
  {
    name: "chitchats_delete_shipment",
    description: "Delete an unpaid shipment. Only shipments without purchased postage can be deleted.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID to delete" },
      },
      required: ["id"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "chitchats_buy_postage",
    description:
      "Purchase postage for a shipment. This is an async operation - check shipment status after.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "chitchats_refund_shipment",
    description: "Request a refund for a shipment with purchased postage.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "chitchats_refresh_rates",
    description:
      "Update shipment dimensions and refresh rate quotes. Useful when package size changes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
        size_x: { type: "number", description: "Updated length" },
        size_y: { type: "number", description: "Updated width" },
        size_z: { type: "number", description: "Updated height" },
        weight: { type: "number", description: "Updated weight" },
      },
      required: ["id"],
    },
  },
  {
    name: "chitchats_count_shipments",
    description: "Get a count of shipments, optionally filtered by status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description: "Filter by status (pending, ready, inducted, in_transit, delivered)",
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  // Batch tools
  {
    name: "chitchats_list_batches",
    description: "List batches with optional status filter and pagination.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max records (up to 1000)" },
        page: { type: "number", description: "Page number" },
        status: {
          type: "string",
          enum: ["pending", "received"],
          description: "Filter by status",
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_create_batch",
    description: "Create a new batch to group shipments for drop-off.",
    inputSchema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "Batch name/description" },
      },
    },
  },
  {
    name: "chitchats_get_batch",
    description: "Get details of a specific batch by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Batch ID" },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "chitchats_delete_batch",
    description: "Delete an empty batch. Batches with shipments cannot be deleted.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Batch ID" },
      },
      required: ["id"],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: "chitchats_add_to_batch",
    description: "Add one or more shipments to a batch.",
    inputSchema: {
      type: "object" as const,
      properties: {
        batch_id: { type: "string", description: "Target batch ID" },
        shipment_ids: {
          type: "array",
          items: { type: "string" },
          description: "Shipment IDs to add",
        },
      },
      required: ["batch_id", "shipment_ids"],
    },
  },
  {
    name: "chitchats_remove_from_batch",
    description: "Remove shipments from their current batches.",
    inputSchema: {
      type: "object" as const,
      properties: {
        shipment_ids: {
          type: "array",
          items: { type: "string" },
          description: "Shipment IDs to remove from batches",
        },
      },
      required: ["shipment_ids"],
    },
  },
  {
    name: "chitchats_count_batches",
    description: "Get count of batches, optionally by status.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["pending", "received"],
          description: "Filter by status",
        },
      },
    },
    annotations: { readOnlyHint: true },
  },
  // Returns
  {
    name: "chitchats_list_returns",
    description: "List return shipments with optional filters.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max records" },
        page: { type: "number", description: "Page number" },
        status: { type: "string", description: "Filter by status" },
        reason: { type: "string", description: "Filter by reason" },
      },
    },
    annotations: { readOnlyHint: true },
  },
  // Tracking
  {
    name: "chitchats_track_shipment",
    description:
      "Get public tracking information for a shipment including status and event history.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Shipment ID" },
      },
      required: ["id"],
    },
    annotations: { readOnlyHint: true },
  },
];

// Register list tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      // Shipment tools
      case "chitchats_list_shipments":
        result = await listShipments(ListShipmentsSchema.parse(args || {}));
        break;
      case "chitchats_get_shipment":
        result = await getShipment(GetShipmentSchema.parse(args));
        break;
      case "chitchats_get_rates":
        result = await getShipmentRates(GetShipmentSchema.parse(args));
        break;
      case "chitchats_get_labels":
        result = await getShipmentLabels(GetShipmentSchema.parse(args));
        break;
      case "chitchats_get_line_items":
        result = await getShipmentLineItems(GetShipmentSchema.parse(args));
        break;
      case "chitchats_create_shipment":
        result = await createShipment(CreateShipmentSchema.parse(args));
        break;
      case "chitchats_delete_shipment":
        result = await deleteShipment(DeleteShipmentSchema.parse(args));
        break;
      case "chitchats_buy_postage":
        result = await buyPostage(BuyPostageSchema.parse(args));
        break;
      case "chitchats_refund_shipment":
        result = await refundShipment(RefundShipmentSchema.parse(args));
        break;
      case "chitchats_refresh_rates":
        result = await refreshRates(RefreshRatesSchema.parse(args));
        break;
      case "chitchats_count_shipments":
        result = await countShipments(CountShipmentsSchema.parse(args || {}));
        break;

      // Batch tools
      case "chitchats_list_batches":
        result = await listBatches(ListBatchesSchema.parse(args || {}));
        break;
      case "chitchats_create_batch":
        result = await createBatch(CreateBatchSchema.parse(args || {}));
        break;
      case "chitchats_get_batch":
        result = await getBatch(GetBatchSchema.parse(args));
        break;
      case "chitchats_delete_batch":
        result = await deleteBatch(DeleteBatchSchema.parse(args));
        break;
      case "chitchats_add_to_batch":
        result = await addToBatch(AddToBatchSchema.parse(args));
        break;
      case "chitchats_remove_from_batch":
        result = await removeFromBatch(RemoveFromBatchSchema.parse(args));
        break;
      case "chitchats_count_batches":
        result = await countBatches(CountBatchesSchema.parse(args || {}));
        break;

      // Returns
      case "chitchats_list_returns":
        result = await listReturns(ListReturnsSchema.parse(args || {}));
        break;

      // Tracking
      case "chitchats_track_shipment":
        result = await trackShipment(TrackShipmentSchema.parse(args));
        break;

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Chit Chats MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
