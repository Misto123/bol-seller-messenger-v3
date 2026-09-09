// BOL.nl automation using Cloud Browser API
import { CloudBrowserClient } from './cloud-browser';

export interface Seller {
  name: string;
  productTitle: string;
  productUrl: string;
  sponsored: boolean;
}

export interface ContactResult {
  seller: string;
  success: boolean;
  timestamp: string;
}

export class BolAutomation {
  private profileId: string;
  private cloudBrowser: CloudBrowserClient;
  private sessionId: string | null = null;
  private puppeteerUrl: string | null = null;

  constructor(profileId: string, cloudBrowserUrl: string, cloudBrowserApiKey: string) {
    this.profileId = profileId;
    this.cloudBrowser = new CloudBrowserClient(cloudBrowserUrl, cloudBrowserApiKey);
  }

  async initialize() {
    console.log(`[BOL] Starting cloud browser for profile ${this.profileId}...`);
    
    const startResult = await this.cloudBrowser.startBrowser(this.profileId, 'adspower');
    
    if (!startResult.success) {
      throw new Error(`Failed to start browser: ${startResult.error}`);
    }
    
    this.sessionId = startResult.sessionId;
    this.puppeteerUrl = startResult.puppeteerUrl;
    
    console.log(`[BOL] Browser started, session: ${this.sessionId}`);
  }

  async searchProducts(keyword: string, sponsoredOnly: boolean = false): Promise<Seller[]> {
    if (!this.puppeteerUrl) {
      throw new Error('Browser not initialized');
    }

    console.log(`[BOL] Searching for: ${keyword} (sponsored: ${sponsoredOnly})`);
    
    // Import puppeteer-core dynamically (only available in Node.js environment)
    const puppeteer = await import('puppeteer-core');
    
    // Connect to the cloud browser using the puppeteerUrl with API key in query string
    const cloudBrowserApiKey = process.env.CLOUD_BROWSER_API_KEY!;
    const wsUrl = `${this.puppeteerUrl}?x_api_key=${cloudBrowserApiKey}`;
    
    const browser = await puppeteer.default.connect({
      browserWSEndpoint: wsUrl,
    });
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    // Search BOL.nl
    const searchUrl = `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract product links
    const productLinks = await page.evaluate((filterSponsored: boolean) => {
      const links = Array.from(document.querySelectorAll('a[href*="/nl/nl/p/"]'));
      const unique = new Map();
      
      links.forEach((link: any) => {
        if (link.href && !unique.has(link.href)) {
          const parentCard = link.closest('[data-test*="product"]') || link.closest('.product-item');
          const isSponsored = parentCard?.querySelector('[class*="sponsor" i], [data-test*="sponsor"]') !== null;
          
          if (!filterSponsored || isSponsored) {
            unique.set(link.href, {
              url: link.href,
              title: link.textContent?.trim() || 'Product',
              sponsored: isSponsored
            });
          }
        }
      });
      
      return Array.from(unique.values());
    }, sponsoredOnly);
    
    console.log(`[BOL] Found ${productLinks.length} products`);
    
    if (productLinks.length === 0) {
      await browser.disconnect();
      throw new Error(sponsoredOnly ? 'No sponsored products found' : 'No products found');
    }
    
    const sellers: Seller[] = [];
    const maxCheck = Math.min(10, productLinks.length);
    
    for (let i = 0; i < maxCheck; i++) {
      const product = productLinks[i];
      console.log(`[BOL] Checking product ${i + 1}/${maxCheck}`);
      
      try {
        await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const sellerInfo = await page.evaluate(() => {
          const sellerLink = document.querySelector('a[href*="/nl/nl/v/"]');
          if (sellerLink) {
            return {
              seller: sellerLink.textContent?.trim() || 'Unknown',
              url: sellerLink.getAttribute('href') || ''
            };
          }
          return null;
        });
        
        if (sellerInfo && sellerInfo.seller.toLowerCase() !== 'bol') {
          console.log(`[BOL] Found seller: ${sellerInfo.seller}`);
          sellers.push({
            name: sellerInfo.seller,
            productTitle: product.title,
            productUrl: product.url,
            sponsored: product.sponsored || false
          });
          
          if (sellers.length >= 2) break;
        }
      } catch (error: any) {
        console.log(`[BOL] Error on product ${i + 1}: ${error.message}`);
      }
    }
    
    await browser.disconnect();
    
    if (sellers.length === 0) {
      throw new Error('No third-party sellers found');
    }
    
    return sellers;
  }

  async contactSeller(seller: Seller, messageData: any): Promise<ContactResult> {
    console.log(`[BOL] Would contact: ${seller.name}`);
    return {
      seller: seller.name,
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    if (this.sessionId) {
      console.log(`[BOL] Stopping browser session ${this.sessionId}`);
      try {
        await this.cloudBrowser.stopBrowser(this.sessionId);
      } catch (error) {
        console.error(`[BOL] Error stopping browser:`, error);
      }
    }
  }
}
