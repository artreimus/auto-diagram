# Auto Diagram

Effortlessly generate beautiful [Mermaid](https://mermaid.js.org/) diagrams from your ideas using AI.

This project is a [Next.js](https://nextjs.org) application that leverages the [Vercel AI SDK](https://sdk.vercel.ai/) to transform natural language prompts into stunning diagrams and charts. Describe a process, architecture, or sequence, and watch it come to life.

<!-- Optional: Add a screenshot or a GIF of the application in action -->
<!-- ![Screenshot of Mermaid Sketch AI](./screenshot.png) -->

## Key Features

- **AI-Powered Diagramming**: Simply describe a complex system, workflow, or idea, and let the AI generate the corresponding Mermaid diagram.
- **Multi-Chart Generation**: From a single high-level prompt, the AI planner can break down the request and generate a whole dashboard of related diagrams.
- **Highly Configurable**: Easily customize the AI models used for different tasks (planning vs. generation) through environment variables.
- **Self-Correcting Syntax**: Includes an API endpoint that attempts to automatically fix any invalid Mermaid syntax returned by the AI, improving reliability.
- **Real-time Streaming**: Diagram code is streamed to the client as it's generated, providing a responsive and interactive experience.
- **Modern Tech Stack**: Built with Next.js, Vercel AI SDK, and styled with the beautiful [shadcn/ui](https://ui.shadcn.com/) component library.

## How It Works

The application follows a simple but powerful flow to generate diagrams:

1.  **User Prompt**: The user enters a descriptive prompt for the diagram(s) they want to create.
2.  **Planning Phase**: The **Planner API** (`/api/planner`) receives the prompt. It uses a powerful "reasoning" model to determine if one or multiple diagrams are needed and plans them out.
3.  **Generation Phase**: For each planned chart, the **Mermaid API** (`/api/mermaid`) calls a "fast" model to generate the Mermaid syntax.
4.  **Syntax Correction**: If the generated syntax is invalid, the frontend can request a fix from the **Fixer API** (`/api/mermaid/fix`), which asks the AI to correct its mistake.
5.  **Rendering**: The frontend receives the final Mermaid syntax and uses the `mermaid.js` library to render the interactive diagram.

This entire process is powered by an intelligent `ai-provider` that selects the best AI provider (Google or OpenRouter) based on your configured API keys.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [@ai-sdk/google](https://sdk.vercel.ai/docs/guides/providers/google-gemini), [@openrouter/ai-sdk-provider](https://github.com/OpenRouter/ai-sdk-provider)
- **Diagramming**: [Mermaid](https://mermaid.js.org/)
- **UI**: [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
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

### Provider Priority

1.  **Google Gemini** (Primary): Used if `GOOGLE_GENERATIVE_AI_API_KEY` is set.
2.  **OpenRouter** (Fallback): Used if the Google API key is not available.

### Required Variables

```env
# At least one API key is required for the app to function.
# You can get a key from https://openrouter.ai/
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Optional Variables

```env
# If provided, Google Gemini will be used as the primary provider.
# Get a key from https://ai.google.dev/
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key"

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
