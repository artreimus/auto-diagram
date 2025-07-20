# Auto Diagram

Effortlessly generate beautiful [Mermaid](https://mermaid.js.org/) diagrams from your ideas using AI.

This project is a [Next.js](https://nextjs.org) application that leverages the [Vercel AI SDK](https://sdk.vercel.ai/) to transform natural language prompts into stunning diagrams and charts. Describe a process, architecture, or sequence, and watch it come to life.

<!-- Optional: Add a screenshot or a GIF of the application in action -->
<!-- ![Screenshot of Mermaid Sketch AI](./screenshot.png) -->

## Key Features

- **AI-Powered Diagramming**: Describe a complex system, workflow, or idea in natural language.
- **Multi-Chart Generation**: An AI planner breaks down high-level prompts to generate multiple, related diagrams in one go.
- **Chart History**: Automatically saves sessions to local storage. Revisit your creations anytime via a unique URL.
- **Self-Correcting Syntax**: An API endpoint automatically fixes invalid Mermaid syntax, improving reliability.
- **Real-time Streaming**: Diagram code is streamed to the client as it's generated for a responsive experience.
- **Polished, Animated UI**: A beautiful, minimalist interface with fluid animations powered by Framer Motion.
- **Highly Configurable**: Customize AI models for different tasks (planning vs. generation) via environment variables.

## How It Works

The application follows a simple but powerful flow to generate diagrams:

1.  **User Prompt**: The user enters a descriptive prompt for the diagram(s) they want to create.
2.  **Planning Phase**: The **Planner API** (`/api/planner`) receives the prompt. It uses a powerful "reasoning" model to determine if one or multiple diagrams are needed and plans them out.
3.  **Generation Phase**: For each planned chart, the **Mermaid API** (`/api/mermaid`) calls a "fast" model to generate the Mermaid syntax.
4.  **Syntax Correction**: If the generated syntax is invalid, the frontend can request a fix from the **Fixer API** (`/api/mermaid/fix`), which asks the AI to correct its mistake.
5.  **Rendering**: The frontend receives the final Mermaid syntax and uses the `mermaid.js` library to render the interactive diagram.
6.  **Session Saving**: Once all charts are complete, the entire session (prompt + charts) is saved to local storage, and the user is redirected to a unique page for that session.

This entire process is powered by an intelligent `ai-provider` that selects the best AI provider (Google or OpenRouter) based on your configured API keys.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [@ai-sdk/google](https://sdk.vercel.ai/docs/guides/providers/google-gemini), [@openrouter/ai-sdk-provider](https://github.com/OpenRouter/ai-sdk-provider)
- **Diagramming**: [Mermaid](https://mermaid.js.org/)
- **UI**: [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Schema & Validation**: [Zod](https://zod.dev/), [@t3-oss/env-nextjs](https://env.t3.gg/)
- **Icons**: [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/en) (version 20.x or higher) installed on your machine.

### 2. Clone the Repository

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.example .env.local
```

Now, open `.env.local` and add your API keys and desired model configurations.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Configuration

The application uses environment variables for configuration, validated by [@t3-oss/env-nextjs](https://env.t3.gg/).

### Provider Selection

You can choose between two AI providers by setting the appropriate API key:

1.  **Google Gemini**: Used if `GOOGLE_GENERATIVE_AI_API_KEY` is set.
2.  **OpenRouter**: Used if `OPENROUTER_API_KEY` is set.

If both keys are provided, Google Gemini will be used as the primary provider based on the default `AI_PROVIDER` setting.

### Required Variables

```env
# At least one API key is required for the app to function.
# Choose either Google Gemini OR OpenRouter (or both)

# Option 1: Use Google Gemini (get a key from https://ai.google.dev/)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

# Option 2: Use OpenRouter (get a key from https://openrouter.ai/)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Optional Variables

```env

# --- Model Configuration ---
# You can override the default models with any compatible model from
# Google or OpenRouter.

# Google Models (used when GOOGLE_GENERATIVE_AI_API_KEY is available)
GOOGLE_FAST_MODEL="gemini-1.5-flash-latest"
GOOGLE_REASONING_MODEL="gemini-1.5-pro-latest"

# OpenRouter Models (used as fallback or if Google key is not set)
# A good free option is: "mistralai/mistral-7b-instruct:free"
OPENROUTER_FAST_MODEL="mistralai/mistral-7b-instruct:free"
OPENROUTER_REASONING_MODEL="anthropic/claude-3-haiku-20240307"
```

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

- Fork the repository.
- Create a new project on Vercel and import your forked repository.
- Add the required environment variables from your `.env.local` file to the Vercel project settings.
- Vercel will automatically build and deploy your application.

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
