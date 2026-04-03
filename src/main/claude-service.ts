import Anthropic from '@anthropic-ai/sdk'
import { BrowserWindow, webContents } from 'electron'
import type { ClaudeMessage } from './ipc-handlers'

// Tool definitions that Claude can use to control frames
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_frame_content',
    description:
      'Read the visible text content and page title from a specific frame/panel. Use this to understand what is currently shown in a frame before interacting with it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: {
          type: 'string',
          description: 'The ID of the frame to read (e.g. "frame-0", "frame-1")'
        }
      },
      required: ['frameId']
    }
  },
  {
    name: 'type_in_frame',
    description:
      'Type text into the currently focused input element in a frame. Works for React-based apps like ChatGPT and Gemini by using native input event simulation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the target frame' },
        selector: {
          type: 'string',
          description:
            'CSS selector for the input element (e.g. "textarea", "div[contenteditable]", "#prompt-textarea"). Leave empty to use the currently focused element.'
        },
        text: { type: 'string', description: 'The text to type' }
      },
      required: ['frameId', 'text']
    }
  },
  {
    name: 'click_in_frame',
    description: 'Click a specific element in a frame using a CSS selector.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the target frame' },
        selector: {
          type: 'string',
          description: 'CSS selector for the element to click'
        }
      },
      required: ['frameId', 'selector']
    }
  },
  {
    name: 'send_message_to_app',
    description:
      'Send a message/prompt to an AI chat app (ChatGPT, Gemini, Claude.ai) in a specific frame. Handles the React SPA input and submission automatically.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the frame containing the chat app' },
        message: { type: 'string', description: 'The message to send to the app' }
      },
      required: ['frameId', 'message']
    }
  },
  {
    name: 'navigate_frame',
    description: 'Navigate a frame to a different URL.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the frame to navigate' },
        url: { type: 'string', description: 'The URL to navigate to' }
      },
      required: ['frameId', 'url']
    }
  },
  {
    name: 'screenshot_frame',
    description:
      'Take a screenshot of a specific frame and return it as a base64 image. Use this when you need to visually understand what is on screen.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the frame to screenshot' }
      },
      required: ['frameId']
    }
  },
  {
    name: 'execute_js_in_frame',
    description:
      'Execute arbitrary JavaScript code in a frame and return the result. Use for advanced interactions not covered by other tools.',
    input_schema: {
      type: 'object' as const,
      properties: {
        frameId: { type: 'string', description: 'The ID of the target frame' },
        code: { type: 'string', description: 'JavaScript code to execute' }
      },
      required: ['frameId', 'code']
    }
  }
]

const SYSTEM_PROMPT = `You are StartHub's AI assistant. You are embedded in a fullscreen window manager application that displays multiple web applications simultaneously in resizable frames.

You have access to tools to control each frame:
- You can READ content from frames (titles, text, DOM elements)
- You can TYPE text into input fields in frames
- You can CLICK buttons and elements in frames
- You can SEND MESSAGES to AI chat apps (ChatGPT, Gemini, Claude.ai) in frames
- You can NAVIGATE frames to different URLs
- You can SCREENSHOT frames to see their current visual state

When a user asks you to interact with an app in a specific frame, use the appropriate tools. Always confirm what frame you're targeting before acting.

Common selectors for popular apps:
- ChatGPT: textarea#prompt-textarea or div[contenteditable] for input, button[data-testid="send-button"] to send
- Gemini: div[contenteditable], textarea for input, button[aria-label*="Send"] to send
- Claude.ai: div[contenteditable="true"] for input, button[aria-label="Send Message"] to send
- YouTube: input#search for search bar

Be helpful, concise, and always explain what you're doing before executing tool calls.`

// Execute a tool call from Claude
async function executeTool(
  toolName: string,
  toolInput: Record<string, string>,
  mainWindow: BrowserWindow
): Promise<string> {
  const renderer = mainWindow.webContents

  switch (toolName) {
    case 'read_frame_content': {
      const code = `
        (() => {
          const title = document.title || '';
          const body = document.body ? document.body.innerText.slice(0, 3000) : '';
          const url = window.location.href;
          return JSON.stringify({ title, url, text: body });
        })()
      `
      const result = await renderer.executeJavaScript(
        `window.electronAPI.executeFrameJs('${toolInput.frameId}', ${JSON.stringify(code)})`
      )
      return typeof result === 'string' ? result : JSON.stringify(result)
    }

    case 'type_in_frame': {
      const { frameId, selector, text } = toolInput
      const selectorStr = selector || 'textarea, [contenteditable="true"], input[type="text"]'
      const escapedText = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/'/g, "\\'")
      const code = `
        (() => {
          const el = document.querySelector(${JSON.stringify(selectorStr)});
          if (!el) return 'Error: element not found with selector: ${selectorStr}';
          el.focus();
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            el.tagName === 'TEXTAREA'
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype,
            'value'
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, ${JSON.stringify(text)});
          } else {
            el.textContent = ${JSON.stringify(text)};
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'Typed successfully into ' + el.tagName;
        })()
      `
      const result = await renderer.executeJavaScript(
        `window.electronAPI.executeFrameJs('${frameId}', ${JSON.stringify(code)})`
      )
      return String(result)
    }

    case 'click_in_frame': {
      const { frameId, selector } = toolInput
      const code = `
        (() => {
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return 'Error: element not found: ${selector}';
          el.click();
          return 'Clicked: ' + el.tagName + (el.textContent?.slice(0,50) || '');
        })()
      `
      const result = await renderer.executeJavaScript(
        `window.electronAPI.executeFrameJs('${frameId}', ${JSON.stringify(code)})`
      )
      return String(result)
    }

    case 'send_message_to_app': {
      const { frameId, message } = toolInput
      // Universal message sender for AI chat apps
      const code = `
        (() => {
          // Try different input selectors common to AI chat apps
          const inputSelectors = [
            'textarea#prompt-textarea',       // ChatGPT
            'div[contenteditable="true"]',    // Gemini, Claude
            'textarea[placeholder]',          // Generic
            'textarea',                       // Fallback
            'input[type="text"]'              // Last resort
          ];

          let inputEl = null;
          for (const sel of inputSelectors) {
            inputEl = document.querySelector(sel);
            if (inputEl) break;
          }

          if (!inputEl) return 'Error: no input element found';

          inputEl.focus();

          // Handle contenteditable divs
          if (inputEl.contentEditable === 'true') {
            inputEl.textContent = ${JSON.stringify(message)};
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            // Handle textarea/input via native setter
            const proto = inputEl.tagName === 'TEXTAREA'
              ? HTMLTextAreaElement.prototype
              : HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) setter.call(inputEl, ${JSON.stringify(message)});
            else inputEl.value = ${JSON.stringify(message)};
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Wait a bit then find and click send button
          return new Promise(resolve => {
            setTimeout(() => {
              const sendSelectors = [
                'button[data-testid="send-button"]',   // ChatGPT
                'button[aria-label*="Send"]',           // Gemini/Claude
                'button[aria-label*="send"]',
                'button[type="submit"]',
                'form button:last-child',
              ];

              let sendBtn = null;
              for (const sel of sendSelectors) {
                sendBtn = document.querySelector(sel);
                if (sendBtn && !sendBtn.disabled) break;
              }

              if (sendBtn) {
                sendBtn.click();
                resolve('Message sent via ' + sendBtn.getAttribute('aria-label') || 'button');
              } else {
                // Try Enter key
                inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                resolve('Message sent via Enter key');
              }
            }, 300);
          });
        })()
      `
      const result = await renderer.executeJavaScript(
        `window.electronAPI.executeFrameJs('${frameId}', ${JSON.stringify(code)})`
      )
      return String(result)
    }

    case 'navigate_frame': {
      const result = await renderer.executeJavaScript(
        `window.electronAPI.navigateFrame('${toolInput.frameId}', ${JSON.stringify(toolInput.url)})`
      )
      return String(result)
    }

    case 'screenshot_frame': {
      const result = await renderer.executeJavaScript(
        `window.electronAPI.screenshotFrame('${toolInput.frameId}')`
      )
      return typeof result === 'string' ? result : JSON.stringify(result)
    }

    case 'execute_js_in_frame': {
      const result = await renderer.executeJavaScript(
        `window.electronAPI.executeFrameJs('${toolInput.frameId}', ${JSON.stringify(toolInput.code)})`
      )
      return typeof result === 'string' ? result : JSON.stringify(result)
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}

export async function handleClaudeChat(
  messages: ClaudeMessage[],
  apiKey: string,
  mainWindow: BrowserWindow
): Promise<{ response: string; toolsUsed: string[] }> {
  const client = new Anthropic({ apiKey })
  const toolsUsed: string[] = []

  let currentMessages = [...messages] as Anthropic.MessageParam[]

  // Agentic loop: keep calling Claude until it stops using tools
  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: currentMessages
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text')
      return {
        response: textBlock ? (textBlock as Anthropic.TextBlock).text : '',
        toolsUsed
      }
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      // Add assistant message with all content blocks
      currentMessages.push({
        role: 'assistant',
        content: response.content
      })

      // Execute all tool calls and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const toolUse of toolUseBlocks) {
        toolsUsed.push(toolUse.name)

        // Notify renderer of tool execution
        mainWindow.webContents.send('claude:tool-executing', {
          tool: toolUse.name,
          input: toolUse.input
        })

        try {
          const result = await executeTool(
            toolUse.name,
            toolUse.input as Record<string, string>,
            mainWindow
          )
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          })
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error executing tool: ${String(err)}`,
            is_error: true
          })
        }
      }

      // Add tool results as user message
      currentMessages.push({
        role: 'user',
        content: toolResults
      })

      continue
    }

    // Unexpected stop reason
    break
  }

  return { response: 'Conversation ended unexpectedly.', toolsUsed }
}

export async function handleClaudeChatStream(
  messages: ClaudeMessage[],
  apiKey: string,
  mainWindow: BrowserWindow
): Promise<{ response: string; toolsUsed: string[] }> {
  // For now delegate to non-streaming version
  // Stream deltas are sent via 'claude:stream-delta' events
  return handleClaudeChat(messages, apiKey, mainWindow)
}
