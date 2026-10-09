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

export class CloudBrowserConnectionError extends Error {
  constructor(
    message: string,
    readonly endpoint: string,
    readonly attempts: number,
    readonly causeMessage?: string,
  ) {
    super(message);
    this.name = 'CloudBrowserConnectionError';
  }
}

export class CloudBrowserClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private getCauseMessage(error: unknown) {
    if (!(error instanceof Error)) return String(error);
    const cause = error.cause;
    if (cause instanceof Error) {
      const code = 'code' in cause ? ` [${String(cause.code)}]` : '';
      return `${cause.message}${code}`;
    }
    return error.message;
  }

  /**
   * Start a browser session
   * @param profileId - AdsPower profile ID (e.g., "k1fgmwtq")
   * @param provider - Browser provider (default: "adspower")
   */
  async startBrowser(profileId: string, provider: string = 'adspower'): Promise<BrowserStartResponse> {
    const endpoint = `${this.apiUrl}/browsers/start`;
    let response: Response;
    try {
      // This POST starts a browser and is not safely repeatable: the server may
      // have started it even if the response connection is lost. Do not retry it.
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x_api_key': this.apiKey,
        },
        body: JSON.stringify({ profileId, provider, timeout: 1800000 }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      const causeMessage = this.getCauseMessage(error);
      throw new CloudBrowserConnectionError(
        `Could not connect to Cloud Browser while starting profile ${profileId}. The start request was attempted once; it was not automatically retried to avoid launching duplicate browsers.`,
        endpoint,
        1,
        causeMessage,
      );
    }

    if (!response.ok) {
      const text = (await response.text()).slice(0, 1200);
      throw new CloudBrowserConnectionError(
        `Cloud Browser rejected the start request (HTTP ${response.status}). ${text || response.statusText}`,
        endpoint,
        1,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new CloudBrowserConnectionError(
        `Cloud Browser returned an invalid JSON response while starting profile ${profileId}.`,
        endpoint,
        1,
        this.getCauseMessage(error),
      );
    }
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
  async checkStatus(): Promise<unknown> {
    const endpoint = `${this.apiUrl}/browsers/status`;
    const maxAttempts = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, {
          headers: { 'x_api_key': this.apiKey },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          const details = (await response.text()).slice(0, 1200) || response.statusText;
          lastError = `HTTP ${response.status}: ${details}`;
          if (response.status < 500 && response.status !== 429) break;
        } else {
          return await response.json();
        }
      } catch (error) {
        lastError = this.getCauseMessage(error);
      }

      if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }

    throw new CloudBrowserConnectionError(
      `Cloud Browser health check failed after ${maxAttempts} attempts. Verify the service is running and reachable from Vercel, and confirm its API key is valid.`,
      endpoint,
      maxAttempts,
      lastError,
    );
  }
}
