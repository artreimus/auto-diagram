# Mermaid Syntax That Renders Reliably in React (with `mermaid` npm)

> Practical, render-safe syntax notes and examples for every major Mermaid diagram, plus integration patterns for React using `mermaid.run`, `mermaid.render`, and `mermaid.parse`.

_Last updated: **July 27, 2025**._

---

## 1) Golden rules to avoid “invalid syntax”

1. **Always start with a diagram type keyword.** The first non‑empty line must declare the type (e.g., `flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `gantt`, `pie`, `gitGraph`, `stateDiagram`, `journey`, `quadrantChart`, `timeline`, `mindmap`, `sankey`, `xychart`, `block`, `packet`, `kanban`, `architecture`, `radar`, `treemap`).
2. **Use comments carefully.** Line comments start with `%%`. Do **not** include `{}` braces inside comments; they can be mistaken for directives. Prefer plain comments like `%% this is fine`.
3. **Quote fragile labels.** Wrap labels containing keywords like `end`, braces, brackets, colons, pipes, or markdown in `"double quotes"`. Lowercase `end` as a node label breaks flowcharts and sequence diagrams—use `"end"`, `End`, or `END`.
4. **One statement per line (or use semicolons).** Mermaid accepts semicolons as line separators. If you inline statements, ensure each is fully formed.
5. **No “nodes inside nodes.”** Don’t nest brackets/braces that look like another node inside a node’s text. Quote the whole label instead.
6. **Directives & frontmatter come first.**
   - **Frontmatter YAML** must begin at line 1, delimited by `---` lines.
   - **Directives** use `%%{ }%%` and must contain valid JSON.

7. **Prefer ASCII.** Use quotes around Unicode text. For sequence messages, escape special characters with HTML entities if needed (e.g., `#35;` for `#`, `#59;` for `;`).
8. **Pick one orientation/layout directive per diagram.** For flowcharts/state diagrams: `TB`, `TD`, `BT`, `LR`, `RL`. Don’t mix.
9. **Keep IDs simple.** Node/actor/class IDs: letters, digits, underscores. Use bracketed text for the display label.
10. **Validate before rendering.** In React, call `await mermaid.parse(code)` and only render when it returns truthy; surface parser errors to the UI.

---

## 2) React integration patterns

### 2.1 Minimal, auto‑rendered blocks

```tsx
import { useEffect } from 'react';
import mermaid from 'mermaid';

export function MermaidAuto() {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
    mermaid.run(); // renders all .mermaid elements
  }, []);

  return (
    <pre className='mermaid'>{`
flowchart TB
  A["Start"] --> B{Is valid?}
  B -- Yes --> C[Render]
  B -- No  --> D["Show error"]
    `}</pre>
  );
}
```

### 2.2 Controlled render with `render()`

```tsx
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export function MermaidRender({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      setError(null);
      mermaid.initialize({ startOnLoad: false });
      try {
        const ok = await mermaid.parse(code); // validate first
        if (!ok) throw new Error('Invalid Mermaid syntax');
        const { svg, bindFunctions } = await mermaid.render(
          'mmd-' + crypto.randomUUID(),
          code
        );
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          bindFunctions?.(containerRef.current);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    }
    draw();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div>
      {error ? <pre role='alert'>{error}</pre> : null}
      <div ref={containerRef} />
    </div>
  );
}
```

### 2.3 Targeted batch render with `run()`

```tsx
useEffect(() => {
  mermaid.initialize({ startOnLoad: false });
  mermaid.run({ querySelector: '.mermaid-host', suppressErrors: true });
}, []);
```

Wrap code blocks in `<pre class="mermaid-host">` to limit which elements are rendered.

### 2.4 Security & HTML in labels

If you need HTML labels or clickable links, set a looser `securityLevel` **only** when you control the content:

```ts
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose', // or 'antiscript'; default is 'strict'
});
```

For untrusted input, keep `strict` or use `sandbox` and avoid HTML in labels.

---

## 3) Configuration you’ll actually use

```ts
mermaid.initialize({
  startOnLoad: false,
  theme: 'default', // 'dark', 'neutral', 'forest', or custom
  look: 'classic', // or 'handDrawn' (flowchart/state only for now)
  layout: 'dagre', // or 'elk' when bundled and enabled
  securityLevel: 'strict',
  flowchart: {
    htmlLabels: true,
    curve: 'basis', // edges: 'linear' | 'basis' | 'natural' | 'monotoneX' | ...
  },
  sequence: {
    showSequenceNumbers: false,
    mirrorActors: true,
  },
});
```

> **Tip:** Use **frontmatter** to override per‑diagram options without touching global config:
>
> ```
> ---
> config:
>   theme: forest
>   look: handDrawn
>   layout: dagre
> ---
> flowchart LR
>   A --> B
> ```

Or use **directives** inline:

```
%%{init: { 'theme': 'forest', 'flowchart': { 'htmlLabels': true } }}%%
flowchart LR
A --> B
```

JSON keys in directives must be quoted.

---

## 4) Flowchart syntax (graph/flowchart)

**Header:** `flowchart TB` (aliases: `flowchart`, `graph`).

### 4.1 Directions

- `TB` / `TD` (top‑down), `BT`, `LR`, `RL`.

### 4.2 Edges

- Basic: `A --> B`, `A --- B` (line), `A -.-> B` (dotted), `A ==> B` (thick), `A ==>|label| B` (labeled).
- Open/cross heads: `A ---o B`, `A ---x B`.
- Multi‑edges: chain with `-->` repeatedly.
- Links/Clicks: `click A href "https://example.com" "Open"` (needs `securityLevel` permitting links).

### 4.3 Node shapes (classic)

- Rectangle `A[Text]`
- Rounded `A( )`
- Stadium `A([ ])`
- Subroutine `A[[ ]]`
- Cylinder `A[( )]`
- Circle `A(( ))`
- Asymmetric `A> ]`
- Diamond `A{ }`
- Hexagon `A{{ }}`
- Parallelogram `A[/ /]`, alt `A[\ \]`
- Trapezoid `A[/\ ]`, alt `A[ \/]`
- Double circle `A((( )))`

### 4.4 Expanded shapes (v11.3+)

Use the generic syntax: `ID@{ shape: <name> }` with shape names such as `rect`, `rounded`, `stadium`, `cyl`, `diam`, `hex`, `circle`, `dbl-circ`, `fork`, `hourglass`, `brace`, `bolt`, `doc`, `lin-doc`, `lin-rect`, `trap-b`, `trap-t`, `notch-rect`, `tag-rect`, `fr-rect`, `fr-circ`, `sm-circ`, `bow-rect`, `win-pane`, `flag`, `tri`, `flip-tri`, etc. Use labels via `ID@{ shape: rect }["Label"]`.

### 4.5 Subgraphs

```
subgraph Group Title
  A --> B
end
```

### 4.6 Styling

- Single node: `style A fill:#f5f5f5,stroke:#333,stroke-width:2px`
- Class defs: `classDef warn fill:#fff3cd,stroke:#664d03,color:#664d03;` then `class A,B warn;`

---

## 5) Sequence diagrams

**Header:** `sequenceDiagram`

- Participants: `participant Alice as "Alice"`, `actor Service`.
- Messages: `Alice->>Bob: hello`, response `Bob-->>Alice: world`.
- Activation: `activate Bob` / `deactivate Bob`, or `Alice->>+Bob:` (activate) and `-->-` (deactivate).
- Lifelines & self‑messages: `Alice->>Alice: do thing`.
- Grouping: `alt ... end`, `opt ... end`, `loop ... end`, `par ... end`, `critical ... option ... end`, `break ... end`.
- Notes: `Note right of Alice: text`, `Note over Alice,Bob: text`.
- Boxes: `box rgb(240,240,240) Label ... end`.
- Background rects: `rect rgba(0,0,255,.1) ... end`.
- Sequence numbers: set config `sequence.showSequenceNumbers: true` or `autonumber` directive.

---

## 6) Class diagrams

**Header:** `classDiagram`

- Class: `class Car { +String make
+start(): void
-miles: number
}`
- Members: `+ public`, `- private`, `# protected`, `~ package`.
- Relationships:
  - Inheritance: `Animal <|-- Dog`
  - Composition: `Car *-- Engine`
  - Aggregation: `Team o-- Player`
  - Association: `A --> B`
  - Dependency: `A ..> B`
  - Realization/Interface: `I <|.. Impl`

- Generics: `Repo~T~`.
- Annotations: `<<interface>>`, `<<abstract>>`.

---

## 7) State diagrams

**Header:** `stateDiagram` or `stateDiagram-v2`

- Start/End: `[*] --> S`, `S --> [*]`.
- Transitions: `S1 --> S2 : event / action` (action optional).
- Composite states:

  ```
  state Auth {
    [*] --> Idle
    Idle --> LoggingIn : submit
  }
  ```

- Choice/Fork/Join:
  - `state if_state <<choice>>` then `A --> if_state`, branches `if_state --> B : yes`.
  - Fork: `state fork_state <<fork>>` / Join `<<join>>`.

- Direction: same `TB/LR/...` after header, e.g., `stateDiagram LR`.

---

## 8) Entity‑Relationship diagrams (ERD)

**Header:** `erDiagram`

- Entities: capitalized recommended but not required: `USER { string id PK }`.
- Attributes block:

  ```
  CUSTOMER {
    string id PK
    string name
    int age
  }
  ```

- Relationships (crow’s foot): `CUSTOMER ||--o{ ORDER : places`, cardinalities:
  - `|o`, `o|`, `||`, `o{`, `}|`, etc.

- Aliases and comments allowed.

---

## 9) Gantt charts

**Header:** `gantt`

- Basics:

  ```
  gantt
    dateFormat  YYYY-MM-DD
    title       Roadmap
    excludes    weekends

    section Core
    Spec        :done,    id1, 2025-01-10,2025-01-15
    Impl        :active,  id2, 2025-01-16, 5d
    QA          :         id3, after id2, 3d
  ```

- Tokens: `:done`, `:active`, `:crit`.
- Durations: `n d`, `n h`, or end dates.
- Dependencies: `after <taskId>`.

---

## 10) Pie charts

**Header:** `pie` (or `pie showData`)

```
pie title Browser share
  "Chrome" : 68
  "Safari" : 19
  "Firefox": 5
```

---

## 11) User Journey

**Header:** `journey`

```
journey
  title Purchase
  section Browse
    Open site       : 3: User
    Filter products : 2: User
  section Checkout
    Pay             : 5: User
```

Scores are 0–7. Multiple actors separated by commas.

---

## 12) Git Graph

**Header:** `gitGraph`

```
gitGraph
  commit id: "init"
  branch feature
  checkout feature
  commit tag: "v1"
  merge main
```

Supports `branch`, `checkout`, `commit` (with `type: HIGHLIGHT`), `merge`, `cherry-pick`, `revert`.

---

## 13) Quadrant chart

**Header:** `quadrantChart`

```
quadrantChart
  title Priorities
  x-axis Low Impact --> High Impact
  y-axis Easy --> Hard
  Point A: [0.2, 0.8]
  Point B: [0.85, 0.3]
```

`x` and `y` are in `[0,1]`.

---

## 14) Mindmap

**Header:** `mindmap`

```
mindmap
  root) Project (
    - Planning
      - Scope
    - Execution
```

Use indentation and list markers (`-`, `::icon`, `::italic`, `::bold`) for styling nodes.

---

## 15) Timeline

**Header:** `timeline`

```
timeline
  title Release
  2025-01-01 : Kickoff
  2025-02-15 : Alpha
  2025-04-01 : GA
```

---

## 16) Sankey

**Header:** `sankey-beta`

```
sankey-beta
  A[Gen] 50:::g --> B[Use]
  A      50     --> C[Loss]
```

Weights are numeric. Style flows and nodes with classes.

---

## 17) XY chart

**Header:** `xychart-beta`

```
xychart-beta
  title Scatter
  x-axis label:"Size" min:0 max:100
  y-axis label:"Score" min:0 max:1
  series A:  (10,0.2),(60,0.8)
```

---

## 18) Block diagram

**Header:** `block`

```
block-beta
  columns 3
  A[In]  B[Proc]  C[Out]
  A --> B --> C
```

---

## 19) Packet, Kanban, Architecture, Radar, Treemap

These are newer/advanced syntaxes. Prefer the live docs examples as syntax may evolve between versions. When you see `-beta` in the header (e.g., `sankey-beta`), expect changes.

---

## 20) Theming & looks

- **Themes:** `default`, `neutral`, `dark`, `forest`. You can override tokens via CSS variables or `themeVariables` in `initialize` or directives.
- **Looks:** `classic` or `handDrawn` (flowchart/state). Choose globally or per‑diagram via frontmatter/directives.
- **Layouts:** `dagre` (default) or `elk` when bundled; ELK offers advanced crossing reduction and edge routing.

Example directive selecting look/layout:

```
%%{init: { "config": { "look": "handDrawn", "layout": "elk" } }}%%
flowchart LR
A --> B
```

---

## 21) Common parse errors & fixes

| Error / Symptom                   | Likely Cause                                                          | Fix                                                                                  |     |                                           |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --- | ----------------------------------------- |
| `Parse error on line X`           | Missing diagram header, unmatched brackets, or stray characters.      | Ensure the first line is the diagram type; check each node/edge token; quote labels. |     |                                           |
| Nothing renders, no error         | `run()` not called, or `startOnLoad:true` with server-side rendering. | In React, call `initialize({startOnLoad:false})` then `await run()` or `render()`.   |     |                                           |
| Comments break rendering          | `%%` comments containing `{}`.                                        | Remove braces or convert to quoted labels.                                           |     |                                           |
| Links/clicks ignored              | `securityLevel` too strict.                                           | Set `securityLevel: 'loose'` or `antiscript`; avoid for untrusted input.             |     |                                           |
| Fonts misplace labels             | Webfonts not loaded before render.                                    | Render on `window.load` or after fonts loaded; or set a fallback font on `.mermaid`. |     |                                           |
| `init` has no effect              | `mermaid.init` deprecated.                                            | Use `mermaid.run` and `initialize`.                                                  |     |                                           |
| Lowercase `end` node label breaks | Reserved keyword in flowchart/sequence.                               | Use `"end"`, `End`, or different text.                                               |     |                                           |
| ERD cardinalities look wrong      | Flipped crow’s foot markers.                                          | Double‑check \`                                                                      |     | --o{\` direction and tail/head placement. |
| C4 diagram won’t parse            | Experimental / gated syntax.                                          | Verify header and use current examples; consider plugin/editor support.              |     |                                           |

---

## 22) Linting checklist (paste into PRs)

- [ ] First line starts with the correct diagram type.
- [ ] No `{}` braces inside `%%` comments.
- [ ] All labels with keywords/special chars are quoted.
- [ ] One orientation declared; no duplicate conflicting directives.
- [ ] For flowcharts: every edge has a valid source and target ID.
- [ ] For sequence: every `alt/opt/loop/par/critical/break` has a matching `end`.
- [ ] For ERD: all relationships use valid cardinality markers and point the right way.
- [ ] For Gantt: every task has either an end date, a duration, or `after <id>`; date format matches `dateFormat`.
- [ ] For pie/journey/quadrant: numeric values are valid (0–1 for quadrant, 0–7 for journey scores).
- [ ] For beta diagrams: header uses the `-beta` suffix as required.
- [ ] `mermaid.parse()` passes locally.

---

## 23) Appendix — tiny recipes

### Detect diagram type before rendering

```ts
const type = mermaid.detectType(code); // throws for unknown
```

### Suppress runtime errors when batch rendering

```ts
await mermaid.run({ suppressErrors: true });
```

### Per‑diagram override with frontmatter

```
---
config:
  theme: dark
  sequence:
    mirrorActors: false
---
sequenceDiagram
Alice->>Bob: Hi
```

### Register a custom icon pack (for flowchart icon shapes)

```ts
import { registerIconPacks } from 'mermaid';
registerIconPacks([
  {
    name: 'my',
    icons: { spark: '<svg viewBox="0 0 24 24">...</svg>' },
  },
]);
```

Use: `A@{ shape: icon, icon: "my:spark" }["Spark"]`.

---

### Quick reference — headers

```
flowchart TB
sequenceDiagram
classDiagram
stateDiagram LR
erDiagram
gantt
pie showData
journey
quadrantChart
gitGraph
mindmap
timeline
sankey-beta
xychart-beta
block-beta
packet
kanban
architecture
radar
treemap
```

---
