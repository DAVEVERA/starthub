Starthub ---- MNRV ---- AINSTEIN

Quick Start: Start npm run dev voor een fullscreen 4x1 grid interface.

Bypass Restrictions: Navigeer naar ChatGPT of Gemini zonder X-Frame-fouten.

Claude Integration: Bestuur frames met tekstcommando's (bijv. "Stuur 'Hallo' naar frame 1").

Resizable Layout: Versleep de splitter om frame-afmetingen direct aan te passen.

Live Config: Wijzig URL's en herlaad webviews via de configuratie-modal.

Build: Genereer een Linux .AppImage met npm run build.

starthub/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── main/
│   │   ├── index.ts              # BrowserWindow, fullscreen, app lifecycle
│   │   ├── session-manager.ts    # X-Frame-Options bypass + partition setup
│   │   ├── ipc-handlers.ts       # IPC hub: webview registry, JS injection
│   │   └── claude-service.ts     # Anthropic SDK, tool definitions, streaming
│   ├── preload/
│   │   └── index.ts              # Context bridge (main ↔ renderer)
│   └── renderer/
│       ├── index.html
│       ├── main.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── GridLayout.tsx    # Resizable raster container
│       │   │   └── FramePanel.tsx    # <webview> + resize handles + overlay UI
│       │   ├── chatbox/
│       │   │   └── ChatBox.tsx       # Claude AI input + streaming responses
│       │   └── config/
│       │       └── FrameConfigForm.tsx  # Frame URL/naam configuratie modal
│       ├── hooks/
│       │   └── useClaude.ts          # Claude API hook met streaming + tools
│       └── store/
│           └── layout.ts                 # Zustand store: frames, layout config


