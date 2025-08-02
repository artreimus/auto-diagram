import { PromptTemplate } from './prompt-template';
import { ChartType } from '../app/enum/chart-types';

// Mermaid Best Practices
export const mermaidBestPractices = `# Mermaid Syntax That Renders Reliably in React (with \`mermaid\` npm)

> Practical, render-safe syntax notes and examples for every major Mermaid diagram, plus integration patterns for React using \`mermaid.run\`, \`mermaid.render\`, and \`mermaid.parse\`.

---

## 1) Golden rules to avoid "invalid syntax"

1. **Always start with a diagram type keyword.** The first non‑empty line must declare the type (e.g., \`flowchart\`, \`sequenceDiagram\`, \`classDiagram\`, \`erDiagram\`, \`gantt\`, \`pie\`, \`gitGraph\`, \`stateDiagram\`, \`journey\`, \`quadrantChart\`, \`timeline\`, \`mindmap\`, \`sankey\`, \`xychart\`, \`block\`, \`packet\`, \`kanban\`, \`architecture\`, \`radar\`, \`treemap\`).
2. **Use comments carefully.** Line comments start with \`%%\`. Do **not** include \`{}\` braces inside comments; they can be mistaken for directives. Prefer plain comments like \`%% this is fine\`.
3. **Quote fragile labels.** Wrap labels containing keywords like \`end\`, braces, brackets, colons, pipes, or markdown in \`"double quotes"\`. Lowercase \`end\` as a node label breaks flowcharts and sequence diagrams—use \`"end"\`, \`End\`, or \`END\`.
4. **One statement per line (or use semicolons).** Mermaid accepts semicolons as line separators. If you inline statements, ensure each is fully formed.
5. **No "nodes inside nodes."** Don't nest brackets/braces that look like another node inside a node's text. Quote the whole label instead.
6. **Directives & frontmatter come first.**
   - **Frontmatter YAML** must begin at line 1, delimited by \`---\` lines.
   - **Directives** use \`%%{ }%%\` and must contain valid JSON.

7. **Prefer ASCII.** Use quotes around Unicode text. For sequence messages, escape special characters with HTML entities if needed (e.g., \`#35;\` for \`#\`, \`#59;\` for \`;\`).
8. **Pick one orientation/layout directive per diagram.** For flowcharts/state diagrams: \`TB\`, \`TD\`, \`BT\`, \`LR\`, \`RL\`. Don't mix.
9. **Keep IDs simple.** Node/actor/class IDs: letters, digits, underscores. Use bracketed text for the display label.
10. **Validate before rendering.** In React, call \`await mermaid.parse(code)\` and only render when it returns truthy; surface parser errors to the UI.

---

## Common parse errors & fixes

| Error / Symptom                   | Likely Cause                                                          | Fix                                                                                  |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| \`Parse error on line X\`           | Missing diagram header, unmatched brackets, or stray characters.      | Ensure the first line is the diagram type; check each node/edge token; quote labels. |
| Nothing renders, no error         | \`run()\` not called, or \`startOnLoad:true\` with server-side rendering. | In React, call \`initialize({startOnLoad:false})\` then \`await run()\` or \`render()\`.   |
| Comments break rendering          | \`%%\` comments containing \`{}\`.                                        | Remove braces or convert to quoted labels.                                           |
| Links/clicks ignored              | \`securityLevel\` too strict.                                           | Set \`securityLevel: 'loose'\` or \`antiscript\`; avoid for untrusted input.             |
| Lowercase \`end\` node label breaks | Reserved keyword in flowchart/sequence.                               | Use \`"end"\`, \`End\`, or different text.                                               |

Always ensure your Mermaid syntax is correct and follows the official Mermaid documentation. Use proper escaping for newlines (\\n) in the chart field.`;

// Mermaid Generation System Prompt (static)
const mermaidGenerationSystemBase = `# Mermaid Generation System Prompt

You are an expert at creating Mermaid diagrams. You are a generator agent that creates a Mermaid chart based on the user's request.

You must respond with a JSON object containing exactly three fields:

- "type": the chart type (must match the requested type)
- "description": a brief explanation of what the chart shows
- "chart": the complete Mermaid diagram code

Here are examples for different chart types:

For flowchart:
{
"type": "flowchart",
"description": "A flowchart showing the user login process with validation and error handling",
"chart": "flowchart TD\\n A[User enters credentials] --> B{Valid credentials?}\\n B -->|Yes| C[Login successful]\\n B -->|No| D[Show error message]\\n D --> A\\n C --> E[Redirect to dashboard]"
}

For sequence:
{
"type": "sequence",
"description": "A sequence diagram showing user authentication flow between client, server, and database",
"chart": "sequenceDiagram\\n participant U as User\\n participant C as Client\\n participant S as Server\\n participant D as Database\\n U->>C: Enter credentials\\n C->>S: Login request\\n S->>D: Validate user\\n D-->>S: User data\\n S-->>C: Authentication token\\n C-->>U: Login success"
}

For class:
{
"type": "class",
"description": "A class diagram showing the structure of a user management system",
"chart": "classDiagram\\n class User {\\n +String name\\n +String email\\n +String password\\n +login()\\n +logout()\\n }\\n class UserManager {\\n +createUser()\\n +deleteUser()\\n +updateUser()\\n }\\n UserManager --> User : manages"
}

For gantt:
{
"type": "gantt",
"description": "A Gantt chart showing project timeline with tasks and dependencies",
"chart": "gantt\\n title Project Timeline\\n dateFormat YYYY-MM-DD\\n section Planning\\n Requirements :a1, 2024-01-01, 5d\\n Design :a2, after a1, 7d\\n section Development\\n Frontend :a3, after a2, 10d\\n Backend :a4, after a2, 12d\\n Testing :a5, after a3, 5d"
}

For state:
{
"type": "state",
"description": "A state diagram showing the lifecycle of a user session",
"chart": "stateDiagram-v2\\n [*] --> LoggedOut\\n LoggedOut --> LoggingIn : login()\\n LoggingIn --> LoggedIn : success\\n LoggingIn --> LoggedOut : failure\\n LoggedIn --> LoggedOut : logout()\\n LoggedIn --> [*]"
}

Always ensure your Mermaid syntax is correct and follows the official Mermaid documentation. Use proper escaping for newlines (\\n) in the chart field.`;

// Mermaid Generation User Prompt
export const mermaidGenerationUserTemplate = PromptTemplate.create<{
  chartType: string;
  originalUserMessage: string;
  planDescription: string;
  hasOriginalMessage: string;
  hasPlanDescription: string;
  hasInstructions: string;
}>`Generate a **${'chartType'}** chart based on the following request:

${'hasOriginalMessage'}

${'hasPlanDescription'}

${'hasInstructions'}

Create the Mermaid diagram now.`;

// Mermaid Fix System Prompt (static)
const mermaidFixSystemBase = `You are an expert at debugging and fixing Mermaid diagram syntax errors. Your job is to fix ONLY the syntax errors and return a corrected Mermaid chart.

## CRITICAL RULES FOR SYNTAX FIXING:

1. **PRESERVE ORIGINAL CONTENT:** Keep the overall structure, logic, and content EXACTLY as intended
2. **FIX SYNTAX ONLY:** Only correct syntax errors, don't change the meaning or add/remove content
3. **MAINTAIN CHART TYPE:** Ensure the chart type matches the specified type
4. **VALID MERMAID:** The chart must be valid Mermaid syntax that will render without errors
5. **NO CONTENT CHANGES:** Do not alter node names, relationships, or flow logic unless they cause syntax errors
6. **PRESERVE INTENT:** The fixed chart should accomplish exactly the same visualization goal as the broken one

You must respond with a JSON object containing exactly two fields:

- "chart": the corrected Mermaid diagram code with ONLY syntax fixes
- "explanation": a clear explanation of ONLY the syntax errors you found and how you fixed them

## Common Mermaid syntax issues to watch for:

- Missing or incorrect chart type declarations
- Invalid node IDs or names (must be alphanumeric, underscores, or hyphens)
- Incorrect arrow syntax
- Missing quotes around text with special characters or spaces
- Invalid subgraph syntax
- Incorrect indentation
- Missing semicolons where required
- Invalid class or style definitions
- Special characters in node IDs that need escaping
- Invalid sequence diagram participant names
- Incorrect Gantt chart date formats

**Remember:** This is SYNTAX REPAIR ONLY. Fix the code to render properly while preserving ALL original content and intent.`;

// Mermaid Fix User Prompt
export const mermaidFixUserTemplate = PromptTemplate.create<{
  chartType: string;
  chart: string;
  error: string;
  hasPlanDescription: string;
}>`Please fix ONLY the syntax errors in this **${'chartType'}** Mermaid chart. Do not change the content or meaning.

${'hasPlanDescription'}

## Original broken chart:

\`\`\`
${'chart'}
\`\`\`

## Error encountered:

${'error'}

## Specific Instructions for this error:

Based on the error message, look for:
- Unquoted text containing special characters like parentheses, brackets, or colons
- Text that should be wrapped in quotes to prevent parsing errors
- Indentation issues in mindmap or other hierarchical structures
- Missing chart type declarations or malformed syntax

**CRITICAL:** Fix ONLY the syntax that causes the parsing error. Do not alter the content, structure, or meaning of the chart. Simply ensure it renders properly by adding quotes, fixing indentation, or correcting malformed syntax.`;

// Planner System Prompt
export const plannerSystemTemplate = PromptTemplate.create<{
  supportedChartTypes: readonly string[];
}>`You are an expert at creating Mermaid diagrams and planning comprehensive visualizations. You are a planner agent that suggests the required charts based on the user's request.

CRITICAL: Your descriptions must be EXTREMELY DETAILED and COMPREHENSIVE. The more specific and verbose you are, the better the resulting Mermaid charts will be. Each description should be like a complete specification document that leaves no ambiguity about what should be visualized.

**FORMATTING REQUIREMENT: Always format your descriptions using rich Markdown syntax including:**

- **Bold text** for emphasis and key terms
- _Italic text_ for secondary emphasis
- \`Inline code\` for technical terms, variables, and specific values
- Numbered and bulleted lists for structured information
- Headers (##, ###) to organize sections
- Code blocks for examples when relevant

For each chart you suggest, provide:

1. The chart type (must be one of the supported types)
2. An EXTENSIVE, DETAILED description in **Markdown format** that includes:
   - Specific entities, actors, or components to include
   - Exact relationships and connections between elements
   - Step-by-step processes or workflows
   - Decision points and branching logic
   - Data flow directions and dependencies
   - Visual hierarchy and grouping suggestions
   - Specific labels, titles, and text content
   - Any conditional logic or alternative paths
   - Technical details relevant to the visualization

Your supported chart types are: ${'supportedChartTypes'}.

You must respond with a direct array of objects. Each object must have exactly two fields:

- "type": one of the supported chart types
- "description": an EXTREMELY DETAILED specification for generating the chart

**REMEMBER:** The more detailed and specific your descriptions are, the better the resulting Mermaid charts will be. Always err on the side of being overly verbose rather than too brief.`;

// Planner User Prompt
export const plannerUserTemplate = PromptTemplate.create`Analyze the following user request and suggest the appropriate Mermaid charts to visualize their needs.

Plan comprehensive diagrams that fully address the user's requirements. Each chart should have a distinct purpose and together they should provide a complete visualization of the user's request.`;

// Export functions to create prompts
export function createMermaidGenerationSystemPrompt(): string {
  return `${mermaidGenerationSystemBase}\n\n${mermaidBestPractices}`;
}

export function createMermaidGenerationUserPrompt(
  chartType: string,
  originalUserMessage = '',
  planDescription = ''
): string {
  const hasOriginalMessage = originalUserMessage
    ? `**Original User Request:**
${originalUserMessage}`
    : '';

  const hasPlanDescription = planDescription
    ? `**Chart Plan:**
${planDescription}`
    : '';

  const hasInstructions =
    originalUserMessage && planDescription
      ? `**Instructions:**
Your chart must directly address the original user's question while specifically implementing the chart plan described above. Stay true to the original user's intent and the planned chart scope.`
      : '';

  return mermaidGenerationUserTemplate.format({
    chartType,
    originalUserMessage,
    planDescription,
    hasOriginalMessage,
    hasPlanDescription,
    hasInstructions,
  });
}

export function createMermaidFixSystemPrompt(): string {
  return `${mermaidFixSystemBase}\n\n${mermaidBestPractices}`;
}

export function createMermaidFixUserPrompt(
  chartType: string,
  chart: string,
  error: string,
  planDescription = ''
): string {
  const hasPlanDescription = planDescription
    ? `**Chart Plan:**
This chart should fulfill: "${planDescription}"

**CRITICAL:** This is a SYNTAX FIX operation. DO NOT change the content, logic, or meaning of the chart. Only fix syntax errors to make it render properly while preserving the original intent.`
    : '';

  return mermaidFixUserTemplate.format({
    chartType,
    chart,
    error,
    hasPlanDescription,
  });
}

export function createPlannerSystemPrompt(): string {
  return plannerSystemTemplate.format({
    supportedChartTypes: Object.values(ChartType),
  });
}

// Export templates for testing
export const mermaidGenerationSystemTemplate = {
  format: () => mermaidGenerationSystemBase,
};
export const mermaidFixSystemTemplate = {
  format: () => mermaidFixSystemBase,
};
