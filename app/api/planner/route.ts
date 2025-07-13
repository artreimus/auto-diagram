import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamObject } from 'ai';
import { supportedChartTypes } from '@/lib/chart-types';
import { plannerSchema } from './schema';

export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemPrompt = `
You are an expert at creating Mermaid diagrams.
You are a planner agent that suggests the required charts based on the user's request.
For each chart you suggest, provide the chart type and a detailed description of what the chart should visualize based on the user's query. This description will be used as a prompt for another AI to generate the Mermaid code.

Your response must only include the following supported chart types: ${supportedChartTypes.join(
  ', '
)}.

You must respond with a direct array of objects. Each object must have exactly two fields:
- "type": one of the supported chart types
- "description": a detailed description for generating the chart

Examples of correct responses:

User: "Show me how user authentication works"
Response: [
  {
    "type": "sequence",
    "description": "A sequence diagram showing user authentication flow with steps: user enters credentials, system validates, database checks, and response with success/failure"
  },
  {
    "type": "flowchart",
    "description": "A flowchart showing the authentication decision process with branches for valid/invalid credentials, account lockout, and password reset options"
  }
]

User: "Create a project management dashboard"
Response: [
  {
    "type": "gantt",
    "description": "A Gantt chart showing project timeline with tasks, dependencies, and milestones for a typical software development project"
  },
  {
    "type": "flowchart",
    "description": "A flowchart showing the project workflow from planning to deployment with decision points and feedback loops"
  }
]

User: "Design a simple calculator app"
Response: [
  {
    "type": "flowchart",
    "description": "A flowchart showing the calculator operation flow with input validation, operation selection, calculation logic, and result display"
  },
  {
    "type": "class",
    "description": "A class diagram showing the calculator app structure with Calculator class, Operation classes, and Display class relationships"
  }
]

Always return a direct array, never wrap it in an object with a "charts" key or any other wrapper.
`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamObject({
    schema: plannerSchema,
    model: openrouter('deepseek/deepseek-r1-0528:free'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
