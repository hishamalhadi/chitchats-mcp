# Contributing

Contributions are welcome! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chitchats-mcp.git
   cd chitchats-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up credentials**
   ```bash
   cp .env.example .env
   # Edit .env with your Chit Chats API credentials
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Project Structure

```
chitchats-mcp/
├── src/
│   ├── index.ts          # MCP server entry point, tool registration
│   ├── client.ts         # API client with authentication
│   ├── schemas.ts        # Zod validation schemas
│   └── tools/
│       ├── shipments.ts  # Shipment operations (11 tools)
│       ├── batches.ts    # Batch operations (7 tools)
│       ├── returns.ts    # Returns listing
│       └── tracking.ts   # Public tracking
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment template
├── package.json
└── tsconfig.json
```

## Adding a New Tool

1. **Define the schema** in `src/schemas.ts`:
   ```typescript
   export const MyNewToolSchema = z.object({
     param1: z.string().describe("Description for the LLM"),
     param2: z.number().optional().describe("Optional parameter"),
   });
   ```

2. **Implement the handler** in the appropriate file under `src/tools/`:
   ```typescript
   export async function myNewTool(
     params: z.infer<typeof MyNewToolSchema>
   ): Promise<string> {
     // Implementation
     return "Result string";
   }
   ```

3. **Register the tool** in `src/index.ts`:
   - Add to imports
   - Add tool definition to `tools` array
   - Add case to switch statement in `CallToolRequestSchema` handler

## Code Style

- Use TypeScript strict mode
- All tool handlers return `Promise<string>`
- Format output as markdown for readability
- Include actionable error messages
- Add `readOnlyHint: true` annotation for read-only tools
- Add `destructiveHint: true` for delete operations

## Testing

Test your changes manually:

```bash
npm run build

# Test a specific function
node -e "
const { myNewTool } = require('./dist/tools/myfile.js');
myNewTool({ param1: 'test' }).then(console.log);
"
```

## API Reference

- [Chit Chats API v1 Documentation](https://chitchats.com/docs/api/v1)
- Rate limit: 2,000 requests per 5-minute window
- Sandbox: `https://staging.chitchats.com`

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure the project builds without errors
4. Update README.md if adding new tools
5. Submit a PR with a description of changes

## Questions?

Open an issue for bugs, feature requests, or questions.
