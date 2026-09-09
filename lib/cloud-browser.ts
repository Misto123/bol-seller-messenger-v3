// Cloud Browser API client for remote browser control
// API Docs: http://65.21.199.228:3000/docs.html

export interface BrowserStartResponse {
  success: boolean;
  data?: {
    puppeteerUrl: string;
    browserId: string;
    timeout: number;
    remainingTime: number;
  };
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
    const response = await fetch(`${this.apiUrl}/browsers/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x_api_key': this.apiKey,
      },
      body: JSON.stringify({
        profileId,
        provider,
        timeout: 1800000, // 30 minutes
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to start browser: ${response.status} ${text}`);
    }

    return response.json();
  }

  /**
   * Stop a browser session
   * @param browserId - Browser ID returned from startBrowser
   * @param provider - Browser provider used when starting
   */
  async stopBrowser(browserId: string, provider: string = 'adspower'): Promise<BrowserStopResponse> {
    const response = await fetch(`${this.apiUrl}/browsers/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x_api_key': this.apiKey,
      },
      body: JSON.stringify({
        browserId,
        provider,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to stop browser: ${response.status} ${text}`);
    }

    return response.json();
  }

  /**
   * Check API status
   */
  async checkStatus(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/browsers/status`, {
      headers: {
        'x_api_key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check status: ${response.statusText}`);
    }

    return response.json();
  }
}
