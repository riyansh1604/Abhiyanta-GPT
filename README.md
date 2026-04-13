# Abhiyanta GPT

Abhiyanta GPT is a Gemini-inspired engineering assistant web app built with React + Vite.
It provides a modern chat interface with session history, persistent recent chats, quick engineering prompts, and OpenRouter-powered AI responses.

## Features

- Engineering-focused assistant behavior across civil, mechanical, electrical, electronics, computer, chemical, and production topics.
- Chat session management:
	- New chat
	- Recent chat list
	- Select a previous chat
	- Delete a chat
- Persistent chat history across refresh using localStorage.
- Responsive UI for desktop, tablet, and mobile.
- Collapsible desktop sidebar and off-canvas mobile sidebar.
- Quick action engineering prompts shown only before the first message in a chat.
- OpenRouter integration with error handling and fallback behavior.

## Tech Stack

- React 19
- Vite 8
- Plain CSS
- OpenRouter Chat Completions API

## Project Structure

```text
domain-gpt/
├─ public/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ Main/
│  │  │  ├─ Main.jsx
│  │  │  └─ Main.css
│  │  └─ Sidebar/
│  │     ├─ Sidebar.jsx
│  │     └─ Sidebar.css
│  ├─ config/
│  │  └─ gemini.js
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ .env.example
├─ package.json
└─ README.md
```

## Getting Started

### 1) Prerequisites

- Node.js 18+
- npm

### 2) Install Dependencies

```bash
npm install
```

### 3) Configure Environment Variables

Create local env file:

```bash
cp .env.example .env.local
```

Edit .env.local:

```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_MODEL=openrouter/auto
```

Notes:

- `VITE_OPENROUTER_API_KEY` is required.
- Use a chat-capable model for `VITE_OPENROUTER_MODEL`.
- If a rerank model is configured, the app attempts fallback routing automatically.

### 4) Run the App

```bash
npm run dev
```

Open the local URL shown by Vite (usually http://localhost:5173).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Chat Persistence

The app stores chat data in browser localStorage:

- `domain-gpt-chat-sessions`
- `domain-gpt-active-chat-id`

Chats remain available after refresh until deleted by the user.

## API Behavior

The API layer is implemented in `src/config/gemini.js` (OpenRouter-based).
It handles:

- Prompt sanitization
- Rate-limit cooldown handling
- Friendly error messages for quota/provider/model issues
- Model candidate fallback

## UI Notes

- Dark Gemini-like visual style with Outfit font.
- Fixed-width sidebar with independent scrolling.
- Desktop: clicking inside the main panel collapses an expanded sidebar.
- Mobile/Tablet: sidebar opens as off-canvas with a backdrop overlay.

## Screenshots

Add product screenshots to showcase the interface. Recommended images:

- Home screen (empty chat + quick actions)
- Active conversation view
- Sidebar expanded and collapsed states
- Mobile view

You can keep screenshots in a folder such as `docs/screenshots/` and embed them like this:

```md
![Home](docs/screenshots/home.png)
![Chat](docs/screenshots/chat.png)
![Mobile](docs/screenshots/mobile.png)
```

## Deployment

### Deploy to Vercel

1. Push the project to GitHub.
2. In Vercel, click New Project and import the repository.
3. Configure build settings:
	- Framework preset: Vite
	- Build command: `npm run build`
	- Output directory: `dist`
4. Add environment variables in Vercel project settings:
	- `VITE_OPENROUTER_API_KEY`
	- `VITE_OPENROUTER_MODEL`
5. Deploy.

### Deploy to Netlify

1. Push the project to GitHub.
2. In Netlify, click Add new site -> Import an existing project.
3. Configure build settings:
	- Build command: `npm run build`
	- Publish directory: `dist`
4. Add environment variables in Site settings -> Environment variables:
	- `VITE_OPENROUTER_API_KEY`
	- `VITE_OPENROUTER_MODEL`
5. Deploy.

## Security

- Do not commit `.env.local`.
- Keep API keys private.
- `.env.example` is safe to commit.

## Disclaimer

Abhiyanta GPT may produce inaccurate responses. Always verify important technical calculations, standards, and safety-critical decisions.
