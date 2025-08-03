# Auto Diagram

Transform your ideas into beautiful diagrams with the power of AI. Describe any process, architecture, or workflow in natural language and watch it come to life as stunning [Mermaid](https://mermaid.js.org/) diagrams.

## 📸 Screenshots

### Main Interface

<img src="./public/homescreen.png" alt="Auto Diagram Home Screen" width="800" />

### Command Suggestions

<img src="./public/homescreen-with-suggestion.png" alt="Auto Diagram with Command Suggestions" width="800" />

### Generated Diagrams

<img src="./public/session.png" alt="Generated Diagram Session" width="800" />

### Demo

<video src="./public/auto-diagram-demo.mp4" controls width="800">
  Your browser does not support the video tag.
</video>

_Complete workflow demonstration - from natural language prompt to generated Mermaid diagram_

## ✨ Features

- **🤖 AI-Powered Diagramming**: Describe complex systems, workflows, or ideas in natural language
- **📊 Multi-Chart Generation**: Intelligent AI planner creates multiple related diagrams from a single prompt
- **⚡ Chart Command Shortcuts**: Type `/flowchart`, `/sequence`, `/class` and more for quick chart type selection
- **🔄 AI Mermaid Syntax Fix**: Use AI to fix invalid Mermaid syntax for improved reliability
- **💾 Session Management**: Automatic save to local storage with shareable unique URLs
- **🎨 Polished UI**: Beautiful, minimalist interface with fluid animations powered by Framer Motion
- **🔧 Multi-Provider Support**: Choose from Google Gemini, OpenRouter, Anthropic Claude, or OpenAI
- **🌐 Web Search Integration**: Enhanced diagram generation with EXA API web search capabilities
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or higher)
- At least one AI provider API key (see configuration below)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/artreimus/auto-diagram.git
   cd auto-diagram
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

4. **Configure your API keys** (edit `.env.local`)

   ```env
   # Choose your preferred AI provider (at least one required)
   AI_PROVIDER=google  # Options: google, openrouter, anthropic, openai

   # API Keys (at least one required)
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here

   # Optional: Web search capabilities
   EXA_API_KEY=your_exa_api_key_here
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser** to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### AI Provider Setup

Choose from four supported AI providers:

| Provider             | API Key Required               | Get Your Key                              |
| -------------------- | ------------------------------ | ----------------------------------------- |
| **Google Gemini**    | `GOOGLE_GENERATIVE_AI_API_KEY` | [Get key](https://ai.google.dev/)         |
| **OpenRouter**       | `OPENROUTER_API_KEY`           | [Get key](https://openrouter.ai/)         |
| **Anthropic Claude** | `ANTHROPIC_API_KEY`            | [Get key](https://console.anthropic.com/) |
| **OpenAI**           | `OPENAI_API_KEY`               | [Get key](https://platform.openai.com/)   |

### Model Configuration (Optional)

Customize the models used for different tasks:

```env
# Google Models
GOOGLE_FAST_MODEL=gemini-2.5-flash
GOOGLE_REASONING_MODEL=gemini-2.5-pro

# OpenRouter Models
OPENROUTER_FAST_MODEL=mistralai/devstral-small-2505:free
OPENROUTER_REASONING_MODEL=deepseek/deepseek-r1-0528:free

# Anthropic Models
ANTHROPIC_FAST_MODEL=claude-sonnet-4-20250514
ANTHROPIC_REASONING_MODEL=claude-opus-4-20250514

# OpenAI Models
OPENAI_FAST_MODEL=gpt-4o-mini
OPENAI_REASONING_MODEL=o3
```

## 🏗️ How It Works

The application uses a sophisticated three-phase process:

<div align="center">
  <img src="./public/flowchart-auto-diagram.png" alt="Auto Diagram Workflow" width="600" />
</div>

**Phase Details:**

1. **📝 Planning Phase**: AI analyzes your prompt and plans single or multiple diagrams
   - Optional web search integration via EXA API for enhanced context
   - Intelligent breakdown of complex prompts into multiple related charts
2. **⚡ Generation Phase**: Fast AI models generate Mermaid syntax for each planned chart
   - Parallel processing for multiple charts
   - Real-time streaming of generated syntax
3. **🔍 Correction Phase**: User-triggered syntax correction when needed
   - Manual activation via fix button when syntax errors occur
   - AI-powered error detection and correction

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **AI Integration**: [AI SDK v5](https://sdk.vercel.ai/) with multiple provider support
- **Diagramming**: [Mermaid.js](https://mermaid.js.org/) for interactive diagrams
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions
- **Validation**: [Zod](https://zod.dev/) for type-safe schemas
- **Environment**: [@t3-oss/env-nextjs](https://env.t3.gg/) for validated environment variables
- **Search**: [EXA API](https://exa.ai/) for web search integration

## 📦 Deployment

### Deploy on Vercel (Recommended)

1. Fork this repository
2. Connect your fork to [Vercel](https://vercel.com/new)
3. Add your environment variables in the Vercel dashboard
4. Deploy automatically with every push

### Other Platforms

This is a standard Next.js application and can be deployed on any platform that supports Node.js.

## 🧪 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests if applicable**
5. **Run linting and tests**
   ```bash
   npm run lint
   npm run test
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'feat: add some feature'
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clear commit messages using [conventional commits](https://www.conventionalcommits.org/)
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) for the amazing diagramming library
- [AI SDK](https://sdk.vercel.ai/) for the powerful AI integration toolkit
- [Vercel](https://vercel.com/) for the hosting platform and development tools
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components

---

**Made with ❤️ for the developer community**

[Report Issues](https://github.com/artreimus/auto-diagram/issues) • [Request Features](https://github.com/artreimus/auto-diagram/issues) • [View Documentation](https://github.com/artreimus/auto-diagram/blob/main/README.md)
