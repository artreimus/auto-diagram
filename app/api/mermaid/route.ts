import { streamObject } from 'ai';
import { supportedChartTypes } from '@/lib/chart-types';
import { mermaidSchema } from './schema';
import { createAIModel } from '@/lib/ai-provider';
import { env } from '@/env.mjs';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chartType } = await req.json();

  if (!supportedChartTypes.includes(chartType)) {
    return new Response(`Unsupported chart type: ${chartType}`, {
      status: 400,
    });
  }

  const systemPrompt = `
You are an expert at creating Mermaid diagrams.
You are a generator agent that creates a Mermaid chart based on the user's request.
Based on the user's request, you will generate a Mermaid chart and a short description of it.
The chart type must be "${chartType}".

You must respond with a JSON object containing exactly three fields:
- "type": the chart type (must be "${chartType}")
- "description": a brief explanation of what the chart shows
- "chart": the complete Mermaid diagram code

Here are examples for different chart types:

For flowchart:
{
  "type": "flowchart",
  "description": "A flowchart showing the user login process with validation and error handling",
  "chart": "flowchart TD\\n    A[User enters credentials] --> B{Valid credentials?}\\n    B -->|Yes| C[Login successful]\\n    B -->|No| D[Show error message]\\n    D --> A\\n    C --> E[Redirect to dashboard]"
}

For sequence:
{
  "type": "sequence",
  "description": "A sequence diagram showing user authentication flow between client, server, and database",
  "chart": "sequenceDiagram\\n    participant U as User\\n    participant C as Client\\n    participant S as Server\\n    participant D as Database\\n    U->>C: Enter credentials\\n    C->>S: Login request\\n    S->>D: Validate user\\n    D-->>S: User data\\n    S-->>C: Authentication token\\n    C-->>U: Login success"
}

For class:
{
  "type": "class",
  "description": "A class diagram showing the structure of a user management system",
  "chart": "classDiagram\\n    class User {\\n        +String name\\n        +String email\\n        +String password\\n        +login()\\n        +logout()\\n    }\\n    class UserManager {\\n        +createUser()\\n        +deleteUser()\\n        +updateUser()\\n    }\\n    UserManager --> User : manages"
}

For gantt:
{
  "type": "gantt",
  "description": "A Gantt chart showing project timeline with tasks and dependencies",
  "chart": "gantt\\n    title Project Timeline\\n    dateFormat  YYYY-MM-DD\\n    section Planning\\n    Requirements    :a1, 2024-01-01, 5d\\n    Design         :a2, after a1, 7d\\n    section Development\\n    Frontend       :a3, after a2, 10d\\n    Backend        :a4, after a2, 12d\\n    Testing        :a5, after a3, 5d"
}

For state:
{
  "type": "state",
  "description": "A state diagram showing the lifecycle of a user session",
  "chart": "stateDiagram-v2\\n    [*] --> LoggedOut\\n    LoggedOut --> LoggingIn : login()\\n    LoggingIn --> LoggedIn : success\\n    LoggingIn --> LoggedOut : failure\\n    LoggedIn --> LoggedOut : logout()\\n    LoggedIn --> [*]"
}

Always ensure your Mermaid syntax is correct and follows the official Mermaid documentation. Use proper escaping for newlines (\\n) in the chart field.
`;

  const result = streamObject({
    schema: mermaidSchema,
    model: createAIModel('fast', env.AI_PROVIDER),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
