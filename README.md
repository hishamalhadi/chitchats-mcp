# Chit Chats MCP Server

A Model Context Protocol (MCP) server for the [Chit Chats](https://chitchats.com) shipping API. Query shipments, track packages, manage batches, and access shipping rates programmatically.

## Features

- **Shipment Management** - List, search, create, and manage shipments
- **Cost Analysis** - Get detailed cost breakdowns including postage, tariffs, broker fees
- **HS Tariff Codes** - Access line item details with HS codes, SKUs, manufacturer info
- **Shipping Rates** - Compare all available carrier options with delivery times
- **Label Downloads** - Get PNG, PDF, and ZPL label URLs
- **Batch Operations** - Organize shipments into batches for drop-off
- **Order Tracking** - Track shipments by order ID (Shopify, Etsy, etc.)

## Installation

```bash
git clone https://github.com/yourusername/chitchats-mcp.git
cd chitchats-mcp
npm install
npm run build
```

## Configuration

1. Get your API credentials from [Chit Chats Settings > Developer > API Access Tokens](https://chitchats.com/settings/api)

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Add your credentials to `.env`:
```
CHITCHATS_CLIENT_ID=your_client_id
CHITCHATS_ACCESS_TOKEN=your_access_token
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "chitchats": {
      "command": "node",
      "args": ["/path/to/chitchats-mcp/dist/index.js"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `chitchats_list_shipments` | List/search shipments with filters |
| `chitchats_get_shipment` | Get full shipment details |
| `chitchats_get_rates` | Get available shipping rates |
| `chitchats_get_labels` | Get label download URLs |
| `chitchats_get_line_items` | Get HS codes, SKUs, manufacturer info |
| `chitchats_create_shipment` | Create a new shipment |
| `chitchats_delete_shipment` | Delete an unpaid shipment |
| `chitchats_buy_postage` | Purchase postage |
| `chitchats_refund_shipment` | Request a refund |
| `chitchats_refresh_rates` | Refresh rate quotes |
| `chitchats_count_shipments` | Count shipments by status |
| `chitchats_list_batches` | List batches |
| `chitchats_create_batch` | Create a batch |
| `chitchats_get_batch` | Get batch details |
| `chitchats_delete_batch` | Delete an empty batch |
| `chitchats_add_to_batch` | Add shipments to a batch |
| `chitchats_remove_from_batch` | Remove shipments from batches |
| `chitchats_count_batches` | Count batches |
| `chitchats_list_returns` | List return shipments |
| `chitchats_track_shipment` | Get tracking information |

## Example Queries

```
"What did I pay for shipping on order #1234?"
"Show me the HS codes for my recent shipments"
"What shipping options are available to California?"
"Get the label for shipment ABC123"
"List all delivered shipments from last month"
```

## Data Available

### Shipment Details
- Order info (order_id, store platform)
- Recipient (name, address, phone, email)
- Package (dimensions, weight, declared value)
- Costs (postage, tariff, broker fee, taxes)
- Labels (PNG, PDF, ZPL URLs)
- Tracking (carrier, tracking number, status)

### Line Items
- HS tariff codes
- SKU codes
- Country of origin
- Manufacturer details

### Rates
- All carrier options
- Cost breakdowns
- Delivery time estimates

## API Reference

This MCP server wraps the [Chit Chats API v1](https://chitchats.com/docs/api/v1).

**Rate Limits:** 2,000 requests per 5-minute window

**Sandbox:** Use `https://staging.chitchats.com` for testing (test card: 4242 4242 4242 4242)

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Build and run
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Chit Chats](https://chitchats.com) - Canadian shipping solution
- [Chit Chats API Docs](https://chitchats.com/docs/api/v1)
- [MCP Protocol](https://modelcontextprotocol.io)
