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

# Mermaid Examples

## Flowchart

flowchart LR
A[Hard] -->|Text| B(Round)
B --> C{Decision}
C -->|One| D[Result 1]
C -->|Two| E[Result 2]

## Sequence diagram

sequenceDiagram
Alice->>John: Hello John, how are you?
loop HealthCheck
    John->>John: Fight against hypochondria
end
Note right of John: Rational thoughts!
John-->>Alice: Great!
John->>Bob: How about you?
Bob-->>John: Jolly good!

## Gantt chart

gantt
    section Section
    Completed :done,    des1, 2014-01-06,2014-01-08
    Active        :active,  des2, 2014-01-07, 3d
    Parallel 1   :         des3, after des1, 1d
    Parallel 2   :         des4, after des1, 1d
    Parallel 3   :         des5, after des3, 1d
    Parallel 4   :         des6, after des4, 1d

## Class diagram

classDiagram
Class01 <|-- AveryLongClass : Cool
<<Interface>> Class01
Class09 --> C2 : Where am I?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
class Class10 {
  <<service>>
  int id
  size()
}

## State diagram

stateDiagram-v2
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]

## Pie chart

pie
"Dogs" : 386
"Cats" : 85.9
"Rats" : 15

## Git graph

gitGraph
  commit
  commit
  branch develop
  checkout develop
  commit
  commit
  checkout main
  merge develop
  commit
  commit

## Bar chart (using gantt)

gantt
    title Git Issues - days since last update
    dateFormat  X
    axisFormat %s

    section Issue19062
    71   : 0, 71
    section Issue19401
    36   : 0, 36
    section Issue193
    34   : 0, 34
    section Issue7441
    9    : 0, 9
    section Issue1300
    5    : 0, 5

## User Journey diagram

journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 3: Me

## C4 diagram

C4Context
title System Context diagram for Internet Banking System

Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
Person(customerB, "Banking Customer B")
Person_Ext(customerC, "Banking Customer C")
System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

Enterprise_Boundary(b1, "BankBoundary") {

  SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

  System_Boundary(b2, "BankBoundary2") {
    System(SystemA, "Banking System A")
    System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts.")
  }

  System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
  SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

  Boundary(b3, "BankBoundary3", "boundary") {
    SystemQueue(SystemF, "Banking System F Queue", "A system of the bank, with personal bank accounts.")
    SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
  }
}

BiRel(customerA, SystemAA, "Uses")
BiRel(SystemAA, SystemE, "Uses")
Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
Rel(SystemC, customerA, "Sends e-mails to")

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
const mermaidFixSystemBase = `You are an expert at debugging and fixing Mermaid diagram syntax errors. Your primary goal is to make broken Mermaid charts render correctly while preserving their original intent and content.

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

## ERROR-SPECIFIC FIXING STRATEGIES:

### Parse Errors:
- **"Parse error on line X"**: Check for unmatched brackets, missing quotes, or invalid syntax at that line
- **"Lexical error"**: Look for special characters that need escaping or quoting
- **"Unexpected token"**: Usually means a keyword or character is used incorrectly

### Common Fixes by Error Pattern:

1. **Text with special characters**: Wrap in double quotes
   - \`A[User (admin)]\` → \`A["User (admin)"]\`
   - \`B[Process: data]\` → \`B["Process: data"]\`

2. **Reserved keywords as labels**: Quote them
   - \`end[End Process]\` → \`End["End Process"]\`
   - \`class[Class Definition]\` → \`Class["Class Definition"]\`

3. **Invalid node IDs**: Use alphanumeric with underscores/hyphens only
   - \`user-profile\` ✓ (valid)
   - \`user profile\` ✗ (invalid) → \`user_profile\` ✓

4. **Missing chart type**: Add proper declaration
   - Missing \`flowchart TD\` at start
   - Missing \`sequenceDiagram\` at start

5. **Incorrect arrow syntax**: Fix malformed connections
   - \`A->B\` → \`A-->B\` (flowchart)
   - \`A>>B\` → \`A->>B\` (sequence)

6. **Indentation issues**: Fix hierarchical structures
   - Mindmaps need proper indentation
   - Subgraphs need consistent spacing

### STEP-BY-STEP FIXING PROCESS:

1. **Identify Error Location**: Focus on the line/area mentioned in error
2. **Categorize Error Type**: Parse, lexical, syntax, or unexpected token
3. **Apply Specific Fix**: Use appropriate strategy from above
4. **Validate Chart Type**: Ensure proper header and syntax for chart type
5. **Quote Special Content**: Add quotes around any labels with special chars
6. **Check Connections**: Verify all arrows/connections use correct syntax

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

## Error Analysis & Fixing Strategy:

**Step 1: Categorize the Error**
- If error mentions "Parse error on line X": Focus on that specific line for bracket mismatches, unquoted special chars
- If error is "Lexical error": Look for special characters that need quoting
- If error is "Unexpected token": Check chart type declaration and arrow syntax
- If error is "Syntax error": Check indentation and structure

**Step 2: Apply Targeted Fixes**
Based on the error message above, systematically check:

1. **Chart Type Header**: Ensure proper declaration (\`flowchart TD\`, \`sequenceDiagram\`, etc.)
2. **Special Characters**: Quote any text containing: \`()\`, \`[]\`, \`{}\`, \`:\`, spaces, or special symbols
3. **Arrow Syntax**: Verify arrows match chart type (\`-->\` for flowchart, \`->>\` for sequence)
4. **Reserved Keywords**: Quote any labels using words like "end", "class", "state"
5. **Node IDs**: Ensure IDs are alphanumeric with underscores/hyphens only
6. **Indentation**: Fix spacing for hierarchical structures (mindmaps, subgraphs)

**Step 3: Quality Check**
- Verify all brackets are matched
- Ensure chart type is correct for the diagram structure
- Confirm all labels with special characters are quoted
- Check that original content and meaning are preserved

**CRITICAL:** This is SYNTAX REPAIR ONLY. Fix the code to render properly while preserving ALL original content and intent.`;

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

export function createPlannerUserPrompt(userPrompt: string): string {
  return `${plannerUserTemplate.format({})}\n\n**User Request:**\n${userPrompt}`;
}

// Web Search Enhancement Types
interface SearchResult {
  title?: string | null;
  url?: string | null;
  publishedDate?: string | null;
  text?: string | null;
}

/**
 * Enhances a user prompt with web search results
 * @param originalPrompt - The original user prompt
 * @param searchResults - Array of search results from web search
 * @returns Enhanced prompt with search context and instructions
 */
export function enhancePromptWithWebSearch(
  originalPrompt: string,
  searchResults: SearchResult[]
): string {
  // If no search results, return original prompt
  if (!searchResults || searchResults.length === 0) {
    return originalPrompt;
  }

  // Format search results with proper attribution and structure
  const searchContext = searchResults
    .map(
      (result, index) =>
        `**Source ${index + 1}: ${result.title || 'Unknown Title'}**\n` +
        `*URL: ${result.url || 'Unknown URL'}*\n` +
        `*Published: ${result.publishedDate || 'Unknown'}*\n\n` +
        `${result.text?.substring(0, 800) || 'No content available'}...\n\n` +
        `---\n`
    )
    .join('\n');

  // Create enhanced prompt with proper prompt engineering
  return `${originalPrompt}

## Additional Context from Web Sources

*The following sources provide current information that may be relevant to your request. Please consider this information when planning diagrams, but prioritize the user's specific requirements above all else.*

${searchContext}

**Instructions for using these sources:**
- Use the source information to enhance accuracy and provide current context
- The sources are supplementary - the user's original request takes priority
- If sources contain relevant technical details, data, or examples, incorporate them thoughtfully
- If sources don't align with the user's request, focus on the original request instead`;
}

// Export templates for testing
export const mermaidGenerationSystemTemplate = {
  format: () => mermaidGenerationSystemBase,
};
export const mermaidFixSystemTemplate = {
  format: () => mermaidFixSystemBase,
};
