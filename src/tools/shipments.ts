import { client } from "../client.js";
import type { z } from "zod";
import type {
  ListShipmentsSchema,
  GetShipmentSchema,
  CreateShipmentSchema,
  DeleteShipmentSchema,
  BuyPostageSchema,
  RefundShipmentSchema,
  RefreshRatesSchema,
  CountShipmentsSchema,
} from "../schemas.js";

// Line item with HS codes, SKUs, manufacturer info
interface LineItem {
  quantity: number;
  description: string;
  value_amount: string;
  currency_code: string;
  hs_tariff_code?: string;
  sku_code?: string;
  origin_country?: string;
  weight?: number;
  weight_unit?: string;
  manufacturer_id?: string;
  manufacturer_contact?: string;
  manufacturer_street?: string;
  manufacturer_street_2?: string;
  manufacturer_city?: string;
  manufacturer_postal_code?: string;
  manufacturer_province_code?: string;
  manufacturer_country_code?: string;
  manufacturer_phone?: string;
  manufacturer_email?: string;
}

// Shipping rate option
interface Rate {
  postage_type: string;
  postage_carrier_type: string;
  postage_description: string;
  delivery_time_description?: string;
  tracking_type_description?: string;
  signature_confirmation_description?: string;
  delivery_duties_paid_description?: string;
  is_insured: boolean;
  purchase_amount: string;
  payment_amount?: string;
  postage_fee: string;
  insurance_fee?: string;
  delivery_fee?: string;
  tariff_fee?: string;
  broker_conveyance_fee?: string;
  shipment_items_fee?: string;
  fda_prior_notification_fee?: string;
  federal_tax?: string;
  provincial_tax?: string;
}

// Full shipment with all fields
interface Shipment {
  id: string;
  status: string;
  batch_id?: number;
  order_id?: string;
  order_store?: string;

  // Recipient
  to_name: string;
  to_address_1?: string;
  to_address_2?: string;
  to_city: string;
  to_province_code: string;
  to_postal_code?: string;
  to_country_code: string;
  to_phone?: string;
  to_email?: string;

  // Return address
  return_name?: string;
  return_address_1?: string;
  return_address_2?: string;
  return_city?: string;
  return_province_code?: string;
  return_postal_code?: string;
  return_country_code?: string;
  return_phone?: string;
  is_return_dispose?: boolean;

  // Package details
  package_contents?: string;
  description?: string;
  value?: string;
  value_currency?: string;
  package_type?: string;
  size_unit?: string;
  size_x?: number;
  size_y?: number;
  size_z?: number;
  weight_unit?: string;
  weight?: number;

  // Service options
  is_insured?: boolean;
  is_insurance_requested?: boolean;
  is_media_mail_requested?: boolean;
  is_signature_requested?: boolean;
  is_delivery_duties_paid_requested?: boolean;

  // Shipping details
  postage_type?: string;
  carrier?: string;
  carrier_tracking_code?: string;
  tracking_url?: string;
  ship_date?: string;

  // Costs
  purchase_amount?: string;
  postage_fee?: string;
  insurance_fee?: string;
  delivery_fee?: string;
  tariff_fee?: string;
  broker_conveyance_fee?: string;
  shipment_items_fee?: string;
  fda_prior_notification_fee?: string;
  federal_tax?: string;
  federal_tax_label?: string;
  provincial_tax?: string;
  provincial_tax_label?: string;

  // Label URLs
  postage_label_png_url?: string;
  postage_label_pdf_url?: string;
  postage_label_zpl_url?: string;

  // Nested data
  line_items?: LineItem[];
  rates?: Rate[];

  created_at: string;
}

export async function listShipments(
  params: z.infer<typeof ListShipmentsSchema>
): Promise<string> {
  const queryParams = new URLSearchParams();

  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.page) queryParams.set("page", params.page.toString());
  if (params.batch_id) queryParams.set("batch_id", params.batch_id);
  if (params.status) queryParams.set("status", params.status);
  if (params.from_date) queryParams.set("from_date", params.from_date);
  if (params.to_date) queryParams.set("to_date", params.to_date);
  if (params.search) queryParams.set("search", params.search);

  const query = queryParams.toString();
  const endpoint = `/shipments${query ? `?${query}` : ""}`;

  const response = await client.get<Shipment[]>(endpoint);

  if (response.error) {
    return `Error listing shipments: ${response.error}`;
  }

  const shipments = response.data || [];

  if (shipments.length === 0) {
    return "No shipments found matching your criteria.";
  }

  const formatted = shipments.map((s) => {
    const lines = [
      `ID: ${s.id}`,
      `Status: ${s.status}`,
      `Recipient: ${s.to_name}, ${s.to_city}, ${s.to_province_code}, ${s.to_country_code}`,
    ];

    if (s.order_id) lines.push(`Order ID: ${s.order_id}`);
    if (s.carrier) lines.push(`Carrier: ${s.carrier}`);
    if (s.postage_type) lines.push(`Postage Type: ${s.postage_type}`);
    if (s.purchase_amount) lines.push(`Total Cost: $${s.purchase_amount}`);
    if (s.carrier_tracking_code)
      lines.push(`Tracking: ${s.carrier_tracking_code}`);

    // Show HS codes from line items if available
    if (s.line_items && s.line_items.length > 0) {
      const hsCodes = [...new Set(s.line_items.map(li => li.hs_tariff_code).filter(Boolean))];
      if (hsCodes.length > 0) {
        lines.push(`HS Codes: ${hsCodes.join(", ")}`);
      }
    }

    if (s.created_at) lines.push(`Created: ${s.created_at}`);

    return lines.join("\n");
  });

  return `Found ${shipments.length} shipment(s):\n\n${formatted.join("\n\n---\n\n")}`;
}

export async function getShipment(
  params: z.infer<typeof GetShipmentSchema>
): Promise<string> {
  const response = await client.get<{ shipment: Shipment }>(
    `/shipments/${params.id}`
  );

  if (response.error) {
    return `Error getting shipment: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return `Shipment ${params.id} not found.`;
  }

  const lines = [
    `## Shipment ${s.id}`,
    "",
    `**Status:** ${s.status}`,
  ];

  // Order info
  if (s.order_id) lines.push(`**Order ID:** ${s.order_id}`);
  if (s.order_store) lines.push(`**Store:** ${s.order_store}`);
  if (s.batch_id) lines.push(`**Batch ID:** ${s.batch_id}`);

  // Recipient
  lines.push("", "### Recipient");
  lines.push(`**Name:** ${s.to_name}`);
  if (s.to_address_1) lines.push(`**Address:** ${s.to_address_1}${s.to_address_2 ? `, ${s.to_address_2}` : ""}`);
  lines.push(`**City:** ${s.to_city}, ${s.to_province_code} ${s.to_postal_code || ""}`);
  lines.push(`**Country:** ${s.to_country_code}`);
  if (s.to_phone) lines.push(`**Phone:** ${s.to_phone}`);
  if (s.to_email) lines.push(`**Email:** ${s.to_email}`);

  // Package details
  lines.push("", "### Package");
  if (s.package_type) lines.push(`**Type:** ${s.package_type}`);
  if (s.package_contents) lines.push(`**Contents Type:** ${s.package_contents}`);
  if (s.description) lines.push(`**Description:** ${s.description}`);
  if (s.size_x && s.size_y && s.size_z) {
    lines.push(`**Dimensions:** ${s.size_x} x ${s.size_y} x ${s.size_z} ${s.size_unit || ""}`);
  }
  if (s.weight) lines.push(`**Weight:** ${s.weight} ${s.weight_unit || ""}`);
  if (s.value) lines.push(`**Declared Value:** $${s.value} ${s.value_currency || ""}`);

  // Service options
  const services = [];
  if (s.is_insured) services.push("Insured");
  if (s.is_signature_requested) services.push("Signature Required");
  if (s.is_delivery_duties_paid_requested) services.push("DDP");
  if (s.is_media_mail_requested) services.push("Media Mail");
  if (services.length > 0) {
    lines.push(`**Services:** ${services.join(", ")}`);
  }

  // Shipping details
  lines.push("", "### Shipping");
  if (s.carrier) lines.push(`**Carrier:** ${s.carrier}`);
  if (s.postage_type) lines.push(`**Postage Type:** ${s.postage_type}`);
  if (s.carrier_tracking_code)
    lines.push(`**Tracking Number:** ${s.carrier_tracking_code}`);
  if (s.tracking_url) lines.push(`**Tracking URL:** ${s.tracking_url}`);
  if (s.ship_date) lines.push(`**Ship Date:** ${s.ship_date}`);

  // Cost breakdown
  lines.push("", "### Cost Breakdown");
  if (s.purchase_amount) lines.push(`**Total Paid:** $${s.purchase_amount}`);
  if (s.postage_fee) lines.push(`- Postage: $${s.postage_fee}`);
  if (s.tariff_fee) lines.push(`- Tariff/Duty: $${s.tariff_fee}`);
  if (s.broker_conveyance_fee) lines.push(`- Broker Fee: $${s.broker_conveyance_fee}`);
  if (s.shipment_items_fee) lines.push(`- Items Fee: $${s.shipment_items_fee}`);
  if (s.insurance_fee) lines.push(`- Insurance: $${s.insurance_fee}`);
  if (s.delivery_fee) lines.push(`- Delivery: $${s.delivery_fee}`);
  if (s.fda_prior_notification_fee) lines.push(`- FDA Fee: $${s.fda_prior_notification_fee}`);
  if (s.federal_tax) lines.push(`- ${s.federal_tax_label || "Federal Tax"}: $${s.federal_tax}`);
  if (s.provincial_tax) lines.push(`- ${s.provincial_tax_label || "Provincial Tax"}: $${s.provincial_tax}`);

  // Line items with HS codes
  if (s.line_items && s.line_items.length > 0) {
    lines.push("", "### Line Items");
    for (const item of s.line_items) {
      lines.push(`**${item.quantity}x ${item.description}**`);
      lines.push(`  - Value: $${item.value_amount} ${item.currency_code.toUpperCase()}`);
      if (item.hs_tariff_code) lines.push(`  - HS Code: ${item.hs_tariff_code}`);
      if (item.sku_code) lines.push(`  - SKU: ${item.sku_code}`);
      if (item.origin_country) lines.push(`  - Origin: ${item.origin_country}`);
      if (item.weight) lines.push(`  - Weight: ${item.weight} ${item.weight_unit || "g"}`);
      if (item.manufacturer_id) {
        lines.push(`  - Manufacturer ID: ${item.manufacturer_id}`);
        if (item.manufacturer_city) {
          lines.push(`  - Manufacturer: ${item.manufacturer_city}, ${item.manufacturer_province_code || ""}`);
        }
      }
    }
  }

  // Available rates
  if (s.rates && s.rates.length > 0) {
    lines.push("", "### Available Rates");
    for (const rate of s.rates) {
      lines.push(`**${rate.postage_description}** (${rate.postage_type})`);
      lines.push(`  - Cost: $${rate.payment_amount || rate.purchase_amount}`);
      if (rate.delivery_time_description) lines.push(`  - Delivery: ${rate.delivery_time_description}`);
      if (rate.tracking_type_description) lines.push(`  - Tracking: ${rate.tracking_type_description}`);
      if (rate.tariff_fee) lines.push(`  - Tariff: $${rate.tariff_fee}`);
    }
  }

  // Labels
  if (s.postage_label_png_url || s.postage_label_pdf_url) {
    lines.push("", "### Labels");
    if (s.postage_label_png_url) lines.push(`- PNG: ${s.postage_label_png_url}`);
    if (s.postage_label_pdf_url) lines.push(`- PDF: ${s.postage_label_pdf_url}`);
    if (s.postage_label_zpl_url) lines.push(`- ZPL: ${s.postage_label_zpl_url}`);
  }

  // Return address
  if (s.return_name) {
    lines.push("", "### Return Address");
    lines.push(`${s.return_name}`);
    if (s.return_address_1) lines.push(`${s.return_address_1}`);
    lines.push(`${s.return_city}, ${s.return_province_code} ${s.return_postal_code}`);
    lines.push(`${s.return_country_code}`);
  }

  lines.push("", `**Created:** ${s.created_at}`);

  return lines.join("\n");
}

// Get just the rates for a shipment
export async function getShipmentRates(
  params: z.infer<typeof GetShipmentSchema>
): Promise<string> {
  const response = await client.get<{ shipment: Shipment }>(
    `/shipments/${params.id}`
  );

  if (response.error) {
    return `Error getting shipment rates: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return `Shipment ${params.id} not found.`;
  }

  if (!s.rates || s.rates.length === 0) {
    return `No rates available for shipment ${params.id}. The shipment may already have postage purchased.`;
  }

  const lines = [
    `## Available Rates for Shipment ${s.id}`,
    "",
    `Destination: ${s.to_city}, ${s.to_province_code}, ${s.to_country_code}`,
    `Package: ${s.weight || "?"} ${s.weight_unit || "g"}, ${s.size_x || "?"}x${s.size_y || "?"}x${s.size_z || "?"} ${s.size_unit || ""}`,
    "",
  ];

  for (const rate of s.rates) {
    lines.push(`### ${rate.postage_description}`);
    lines.push(`- **Type:** ${rate.postage_type}`);
    lines.push(`- **Carrier:** ${rate.postage_carrier_type}`);
    lines.push(`- **Total Cost:** $${rate.payment_amount || rate.purchase_amount}`);

    // Cost breakdown
    lines.push(`  - Postage: $${rate.postage_fee}`);
    if (rate.tariff_fee) lines.push(`  - Tariff: $${rate.tariff_fee}`);
    if (rate.broker_conveyance_fee) lines.push(`  - Broker: $${rate.broker_conveyance_fee}`);
    if (rate.shipment_items_fee) lines.push(`  - Items Fee: $${rate.shipment_items_fee}`);
    if (rate.insurance_fee) lines.push(`  - Insurance: $${rate.insurance_fee}`);

    if (rate.delivery_time_description) lines.push(`- **Delivery:** ${rate.delivery_time_description}`);
    if (rate.tracking_type_description) lines.push(`- **Tracking:** ${rate.tracking_type_description}`);
    if (rate.is_insured) lines.push(`- **Insured:** Yes`);
    lines.push("");
  }

  return lines.join("\n");
}

// Get label URLs for a shipment
export async function getShipmentLabels(
  params: z.infer<typeof GetShipmentSchema>
): Promise<string> {
  const response = await client.get<{ shipment: Shipment }>(
    `/shipments/${params.id}`
  );

  if (response.error) {
    return `Error getting shipment labels: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return `Shipment ${params.id} not found.`;
  }

  if (!s.postage_label_png_url && !s.postage_label_pdf_url) {
    return `No labels available for shipment ${params.id}. Postage may not have been purchased yet.`;
  }

  const lines = [
    `## Labels for Shipment ${s.id}`,
    "",
    `Order: ${s.order_id || "N/A"}`,
    `Recipient: ${s.to_name}, ${s.to_city}, ${s.to_country_code}`,
    `Carrier: ${s.carrier || "N/A"}`,
    `Tracking: ${s.carrier_tracking_code || "N/A"}`,
    "",
    "### Download URLs",
  ];

  if (s.postage_label_png_url) lines.push(`- **PNG:** ${s.postage_label_png_url}`);
  if (s.postage_label_pdf_url) lines.push(`- **PDF:** ${s.postage_label_pdf_url}`);
  if (s.postage_label_zpl_url) lines.push(`- **ZPL:** ${s.postage_label_zpl_url}`);

  return lines.join("\n");
}

// Get line items with HS codes for a shipment
export async function getShipmentLineItems(
  params: z.infer<typeof GetShipmentSchema>
): Promise<string> {
  const response = await client.get<{ shipment: Shipment }>(
    `/shipments/${params.id}`
  );

  if (response.error) {
    return `Error getting line items: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return `Shipment ${params.id} not found.`;
  }

  if (!s.line_items || s.line_items.length === 0) {
    return `No line items found for shipment ${params.id}.`;
  }

  const lines = [
    `## Line Items for Shipment ${s.id}`,
    "",
    `Order: ${s.order_id || "N/A"}`,
    `Recipient: ${s.to_name}, ${s.to_country_code}`,
    "",
  ];

  for (const item of s.line_items) {
    lines.push(`### ${item.description}`);
    lines.push(`- **Quantity:** ${item.quantity}`);
    lines.push(`- **Value:** $${item.value_amount} ${item.currency_code.toUpperCase()}`);
    if (item.hs_tariff_code) lines.push(`- **HS Tariff Code:** ${item.hs_tariff_code}`);
    if (item.sku_code) lines.push(`- **SKU:** ${item.sku_code}`);
    if (item.origin_country) lines.push(`- **Country of Origin:** ${item.origin_country}`);
    if (item.weight) lines.push(`- **Weight:** ${item.weight} ${item.weight_unit || "g"}`);

    // Manufacturer info
    if (item.manufacturer_id) {
      lines.push("", "**Manufacturer:**");
      lines.push(`  - ID: ${item.manufacturer_id}`);
      if (item.manufacturer_contact) lines.push(`  - Contact: ${item.manufacturer_contact}`);
      if (item.manufacturer_street) lines.push(`  - Address: ${item.manufacturer_street}`);
      if (item.manufacturer_city) {
        lines.push(`  - Location: ${item.manufacturer_city}, ${item.manufacturer_province_code || ""} ${item.manufacturer_postal_code || ""}`);
      }
      if (item.manufacturer_phone) lines.push(`  - Phone: ${item.manufacturer_phone}`);
      if (item.manufacturer_email) lines.push(`  - Email: ${item.manufacturer_email}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function createShipment(
  params: z.infer<typeof CreateShipmentSchema>
): Promise<string> {
  const body: Record<string, unknown> = {
    name: params.name,
    address_1: params.address_1,
    city: params.city,
    province_code: params.province_code,
    postal_code: params.postal_code,
    country_code: params.country_code,
  };

  if (params.address_2) body.address_2 = params.address_2;
  if (params.phone) body.phone = params.phone;
  if (params.email) body.email = params.email;
  if (params.package_type) body.package_type = params.package_type;
  if (params.size_unit) body.size_unit = params.size_unit;
  if (params.size_x) body.size_x = params.size_x;
  if (params.size_y) body.size_y = params.size_y;
  if (params.size_z) body.size_z = params.size_z;
  if (params.weight_unit) body.weight_unit = params.weight_unit;
  if (params.weight) body.weight = params.weight;
  if (params.description) body.description = params.description;
  if (params.value) body.value = params.value;
  if (params.value_currency) body.value_currency = params.value_currency;
  if (params.order_id) body.order_id = params.order_id;
  if (params.order_store) body.order_store = params.order_store;
  if (params.postage_type) body.postage_type = params.postage_type;

  const response = await client.post<{ shipment: Shipment }>("/shipments", body);

  if (response.error) {
    return `Error creating shipment: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return "Shipment created but no data returned.";
  }

  return `Shipment created successfully!\n\nID: ${s.id}\nStatus: ${s.status}\nRecipient: ${s.to_name}, ${s.to_city}, ${s.to_country_code}`;
}

export async function deleteShipment(
  params: z.infer<typeof DeleteShipmentSchema>
): Promise<string> {
  const response = await client.delete(`/shipments/${params.id}`);

  if (response.error) {
    return `Error deleting shipment: ${response.error}. Note: Only unpaid shipments can be deleted.`;
  }

  return `Shipment ${params.id} deleted successfully.`;
}

export async function buyPostage(
  params: z.infer<typeof BuyPostageSchema>
): Promise<string> {
  const response = await client.patch<{ shipment: Shipment }>(
    `/shipments/${params.id}/buy`
  );

  if (response.error) {
    return `Error purchasing postage: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return "Postage purchase initiated. Poll the shipment status to check completion.";
  }

  const lines = [
    `Postage purchased for shipment ${s.id}!`,
    "",
    `Status: ${s.status}`,
  ];

  if (s.purchase_amount) lines.push(`Total Cost: $${s.purchase_amount}`);
  if (s.carrier_tracking_code)
    lines.push(`Tracking Number: ${s.carrier_tracking_code}`);

  return lines.join("\n");
}

export async function refundShipment(
  params: z.infer<typeof RefundShipmentSchema>
): Promise<string> {
  const response = await client.patch<{ shipment: Shipment }>(
    `/shipments/${params.id}/refund`
  );

  if (response.error) {
    return `Error requesting refund: ${response.error}`;
  }

  return `Refund requested for shipment ${params.id}. Check shipment status for updates.`;
}

export async function refreshRates(
  params: z.infer<typeof RefreshRatesSchema>
): Promise<string> {
  const body: Record<string, unknown> = {};

  if (params.size_x) body.size_x = params.size_x;
  if (params.size_y) body.size_y = params.size_y;
  if (params.size_z) body.size_z = params.size_z;
  if (params.weight) body.weight = params.weight;

  const response = await client.patch<{ shipment: Shipment }>(
    `/shipments/${params.id}/refresh`,
    Object.keys(body).length > 0 ? body : undefined
  );

  if (response.error) {
    return `Error refreshing rates: ${response.error}`;
  }

  const s = response.data?.shipment;
  if (!s) {
    return `Rates refreshed for shipment ${params.id}.`;
  }

  let result = `Rates refreshed for shipment ${s.id}.\n\nCurrent postage type: ${s.postage_type || "Not set"}`;

  if (s.rates && s.rates.length > 0) {
    result += `\n\nAvailable rates:\n`;
    for (const rate of s.rates) {
      result += `- ${rate.postage_description}: $${rate.payment_amount || rate.purchase_amount}\n`;
    }
  }

  return result;
}

export async function countShipments(
  params: z.infer<typeof CountShipmentsSchema>
): Promise<string> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.set("status", params.status);

  const query = queryParams.toString();
  const endpoint = `/shipments/count${query ? `?${query}` : ""}`;

  const response = await client.get<{ count: number }>(endpoint);

  if (response.error) {
    return `Error counting shipments: ${response.error}`;
  }

  const count = response.data?.count ?? 0;
  const statusText = params.status ? ` with status "${params.status}"` : "";

  return `Total shipments${statusText}: ${count}`;
}
