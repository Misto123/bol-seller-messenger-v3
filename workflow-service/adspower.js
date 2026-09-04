import fetch from 'node-fetch';

const ADSPOWER_PORT = process.env.ADSPOWER_PORT || '50326';
const ADSPOWER_API_KEY = process.env.ADSPOWER_API_KEY || '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';

class AdsPowerClient {
  constructor() {
    this.baseUrl = `http://localhost:${ADSPOWER_PORT}`;
    this.apiKey = ADSPOWER_API_KEY;
  }

  async request(endpoint, params = {}) {
    const url = new URL(endpoint, this.baseUrl);
    url.searchParams.append('api_key', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`AdsPower API error: ${response.status}`);
    }
    return response.json();
  }

  async listProfiles() {
    return this.request('/api/v1/user/list');
  }

  async startProfile(profileId) {
    return this.request('/api/v1/browser/start', { user_id: profileId });
  }

  async stopProfile(profileId) {
    return this.request('/api/v1/browser/stop', { user_id: profileId });
  }

  async getProfileStatus(profileId) {
    return this.request('/api/v1/browser/active', { user_id: profileId });
  }
}

export const adsPower = new AdsPowerClient();
