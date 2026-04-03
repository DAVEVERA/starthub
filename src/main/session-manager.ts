import { session } from 'electron'

/**
 * Removes X-Frame-Options and relaxes CSP frame-ancestors for ALL sessions,
 * including named partitions (persist:frameXxx). This allows embedding
 * sites like ChatGPT, Gemini, etc. that normally block iframe embedding.
 */
export function setupSessionManager(): void {
  // Apply to default session
  applyHeadersBypass(session.defaultSession)

  // Intercept partition creation so every new persist:xxx session also gets the bypass
  session.defaultSession.webRequest.onHeadersReceived(buildInterceptor())
}

function applyHeadersBypass(sess: Electron.Session): void {
  sess.webRequest.onHeadersReceived(buildInterceptor())
}

function buildInterceptor() {
  return (
    details: Electron.OnHeadersReceivedListenerDetails,
    callback: (response: Electron.HeadersReceivedResponse) => void
  ): void => {
    const headers = { ...details.responseHeaders }

    // Remove X-Frame-Options (blocks iframe/webview embedding)
    delete headers['x-frame-options']
    delete headers['X-Frame-Options']

    // Relax CSP frame-ancestors directive
    const cspKeys = Object.keys(headers).filter((k) =>
      k.toLowerCase() === 'content-security-policy'
    )
    for (const key of cspKeys) {
      headers[key] = (headers[key] as string[]).map((policy) =>
        policy.replace(/frame-ancestors[^;]*/gi, 'frame-ancestors *')
      )
    }

    callback({ responseHeaders: headers })
  }
}

/**
 * Call this when a new webview partition is created so it also gets the bypass.
 * The renderer calls 'session:setup-partition' IPC when registering a new frame.
 */
export function setupPartitionSession(partition: string): void {
  try {
    const partitionSession = session.fromPartition(partition)
    applyHeadersBypass(partitionSession)
  } catch (err) {
    console.error(`Failed to setup partition session for ${partition}:`, err)
  }
}
