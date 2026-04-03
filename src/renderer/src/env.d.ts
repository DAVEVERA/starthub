/// <reference types="vite/client" />

// Electron webview element type declarations for React/JSX
declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      partition?: string
      allowpopups?: string
      nodeintegration?: string
      webpreferences?: string
      useragent?: string
      httpreferrer?: string
      style?: React.CSSProperties
      ref?: React.Ref<HTMLElement>
    }
  }
}
