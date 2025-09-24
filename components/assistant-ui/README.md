# Omen Tool Registry

This directory contains custom tool UI components for the Omen eCommerce UX Co-Pilot. The tool registry system allows you to create custom displays for specific tool calls made by your AI assistant.

## Structure

- `tool-registry.tsx` - Central registry for all custom tool UIs
- `hypotheses-display.tsx` - Custom display for `generate_hypotheses` tool calls
- `tool-fallback.tsx` - Default fallback display for unregistered tools

## Adding a New Tool UI

1. Create a new component file (e.g., `my-tool-display.tsx`)
2. Define the component with proper TypeScript types:

```tsx
interface MyToolDisplayProps {
  toolName: string;
  argsText: string;
  result: any;
  status: {
    type: "running" | "complete" | "error";
  };
}

export const MyToolDisplay = ({ toolName, argsText, result, status }: MyToolDisplayProps) => {
  // Your custom UI logic here
  return <div>My custom tool display</div>;
};
```

3. Register the tool in `tool-registry.tsx`:

```tsx
import { makeAssistantToolUI } from "@assistant-ui/react";
import { MyToolDisplay } from "./my-tool-display";

export const MyToolUI = makeAssistantToolUI({
  toolName: "my_tool_name", // Must match the tool name used by your agent
  render: MyToolDisplay,
});

export const toolUIs = [
  HypothesesToolUI,
  MyToolUI, // Add your new tool UI here
];
```

## How It Works

The `assistant-ui` library automatically detects when a tool is called and renders the appropriate custom UI component. The tool name must exactly match the name used by your AI agent when making the tool call.

## Current Tool UIs

- **generate_hypotheses**: Displays structured hypothesis data with rationale, tests, metrics, and accessibility checks
