Starthub ---- MNRV ---- AINSTEIN

/home/user/starthub/
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
│       │   │   ├── GridLayout.tsx       # Resizable raster container
│       │   │   └── FramePanel.tsx       # <webview> + resize handles + overlay UI
│       │   ├── chatbox/
│       │   │   └── ChatBox.tsx          # Claude AI input + streaming responses
│       │   └── config/
│       │       └── FrameConfigForm.tsx  # Frame URL/naam configuratie modal
│       ├── hooks/
│       │   └── useClaude.ts             # Claude API hook met streaming + tools
│       └── store/
│           └── layout.ts                # Zustand store: frames, layout config


npm run dev — Electron opent in fullscreen met 4x1 grid
Navigeer frames naar chatgpt.com, gemini.google.com — beide laden zonder X-Frame fout
Type in chatbox: "Stuur 'Hallo' naar ChatGPT in frame 1" → Claude voert het uit
Resize een frame door de splitter te slepen
Open config modal, verander frame URL, herstart webview
npm run build — genereert .AppImage voor Linux
