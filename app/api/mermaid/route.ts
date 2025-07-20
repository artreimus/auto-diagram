import { streamObject } from 'ai';
import { supportedChartTypes } from '@/lib/chart-types';
import { mermaidSchema, mermaidRequestSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json();

  // Validate the request using the new schema
  const validation = mermaidRequestSchema.safeParse(body);
  if (!validation.success) {
    return new Response(`Invalid request format: ${validation.error.message}`, {
      status: 400,
    });
  }

  const { messages, chartType, originalUserMessage, planDescription } =
    validation.data;

  if (!supportedChartTypes.includes(chartType)) {
    return new Response(`Unsupported chart type: ${chartType}`, {
      status: 400,
    });
  }

  // Enhanced system prompt that includes context awareness
  const contextSection =
    originalUserMessage && planDescription
      ? `

ORIGINAL USER CONTEXT:
The user originally asked: "${originalUserMessage}"

SPECIFIC CHART PLAN:
This chart should fulfill: "${planDescription}"

IMPORTANT: Your chart must directly address the original user's question while specifically implementing the chart plan described above. Stay true to the original user's intent and the planned chart scope.`
      : '';

  const systemPrompt = `You are an expert at creating simple, reliable Mermaid diagrams that render correctly.
You are a generator agent that creates a Mermaid chart based on the user's request.
Based on the user's request, you will generate a Mermaid chart and a short description of it.
The chart type must be "${chartType}".${contextSection}

CRITICAL SYNTAX RULES - FOLLOW THESE EXACTLY:
1. Use only simple alphanumeric node IDs (A, B, C or node1, node2, etc.)
2. Keep node text short and simple - avoid special characters
3. Use basic arrows only: --> (flowchart), ->> (sequence), --> (class)
4. Always use the exact chart type declaration from examples
5. Keep indentation consistent (4 spaces)
6. Avoid complex styling, classes, or advanced features
7. Use quotes around text only when absolutely necessary
8. Test mentally: each line should be valid basic Mermaid syntax

You must respond with a JSON object containing exactly three fields:
- "type": the chart type (must be "${chartType}")
- "description": a brief explanation of what the chart shows
- "chart": the complete Mermaid diagram code (keep it SIMPLE!)

SIMPLE EXAMPLES FOR EACH CHART TYPE:

For flowchart:
{
  "type": "flowchart",
  "description": "Simple flowchart showing a basic process",
  "chart": "flowchart TD\\n    A[Start] --> B[Process]\\n    B --> C{Decision}\\n    C -->|Yes| D[Action 1]\\n    C -->|No| E[Action 2]\\n    D --> F[End]\\n    E --> F"
}

For sequence:
{
  "type": "sequence", 
  "description": "Simple sequence diagram showing interaction between participants",
  "chart": "sequenceDiagram\\n    participant A as User\\n    participant B as System\\n    A->>B: Request\\n    B-->>A: Response"
}

For class:
{
  "type": "class",
  "description": "Simple class diagram showing basic relationships",
  "chart": "classDiagram\\n    class User {\\n        name\\n        email\\n        login()\\n    }\\n    class System {\\n        process()\\n    }\\n    User --> System"
}

For state:
{
  "type": "state",
  "description": "Simple state diagram showing basic state transitions",
  "chart": "stateDiagram-v2\\n    [*] --> StateA\\n    StateA --> StateB\\n    StateB --> StateC\\n    StateC --> [*]"
}

For gantt:
{
  "type": "gantt",
  "description": "Simple Gantt chart showing basic project timeline", 
  "chart": "gantt\\n    title Simple Project\\n    dateFormat YYYY-MM-DD\\n    section Phase 1\\n    Task 1 :2024-01-01, 5d\\n    Task 2 :2024-01-06, 3d"
}

For journey:
{
  "type": "journey",
  "description": "Simple user journey map",
  "chart": "journey\\n    title User Journey\\n    section Experience\\n    Step 1: 5: User\\n    Step 2: 3: User\\n    Step 3: 4: User"
}

For mindmap:
{
  "type": "mindmap",
  "description": "Simple mindmap showing basic concepts",
  "chart": "mindmap\\n  root((Main Topic))\\n    A[Branch 1]\\n      B[Sub Item]\\n    C[Branch 2]\\n      D[Sub Item]"
}

For timeline:
{
  "type": "timeline",
  "description": "Simple timeline showing key events",
  "chart": "timeline\\n    title Simple Timeline\\n    2024 : Event 1\\n    2025 : Event 2\\n    2026 : Event 3"
}

For gitgraph:
{
  "type": "gitgraph",
  "description": "Simple git graph showing basic branching",
  "chart": "gitgraph\\n    commit\\n    branch develop\\n    checkout develop\\n    commit\\n    checkout main\\n    merge develop"
}

REMEMBER: Keep it SIMPLE! Avoid complex syntax, special characters, or advanced features. Focus on basic, reliable Mermaid patterns that always render correctly.
`;

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('fast', env.AI_PROVIDER),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
