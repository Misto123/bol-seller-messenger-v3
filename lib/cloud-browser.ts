// Cloud Browser API client for remote browser control
// API Docs: http://65.21.199.228:3000/docs.html

export interface BrowserStartResponse {
  success: boolean;
  sessionId: string;
  puppeteerUrl: string;
  debuggerUrl?: string;
  error?: string;
}

export interface BrowserStopResponse {
  success: boolean;
  data?: {
    urls?: Array<{ url: string; timestamp: number; mode: string }>;
    screenshots?: Array<{ url: string; filePath: string; fileUrl: string; timestamp: number }>;
  };
  error?: string;
}

export class CloudBrowserClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Start a browser session
   * @param profileId - AdsPower profile ID (e.g., "k1fgmwtq")
   * @param provider - Browser provider (default: "adspower")
   */
  async startBrowser(profileId: string, provider: string = 'adspower'): Promise<BrowserStartResponse> {
    const response = await fetch(`${this.apiUrl}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        profileId,
        provider,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start browser: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stop a browser session
   * @param sessionId - Session ID returned from startBrowser
   */
  async stopBrowser(sessionId: string): Promise<BrowserStopResponse> {
    const response = await fetch(`${this.apiUrl}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop browser: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check API status
   */
  async checkStatus(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.apiUrl}/status`, {
      headers: {
        'x-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    return response.json();
  }
}
