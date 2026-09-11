// BOL.nl automation using Cloud Browser API
import { CloudBrowserClient } from './cloud-browser';
import { insertMessageLog, MessageLog } from './supabase-db';
import path from 'path';
import fs from 'fs';

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
  screenshotPath?: string;
}

export class BolAutomation {
  private profileId: string;
  private cloudBrowser: CloudBrowserClient;
  private browserId: string | null = null;
  private puppeteerUrl: string | null = null;
  private currentPage: any = null;
  private currentBrowser: any = null;
  private ipAddress: string | null = null;

  constructor(profileId: string, cloudBrowserUrl: string, cloudBrowserApiKey: string) {
    this.profileId = profileId;
    this.cloudBrowser = new CloudBrowserClient(cloudBrowserUrl, cloudBrowserApiKey);
  }

  async initialize() {
    console.log(`[BOL] Starting cloud browser for profile ${this.profileId}...`);
    
    const startResult = await this.cloudBrowser.startBrowser(this.profileId, 'adspower');
    
    if (!startResult.success || !startResult.data) {
      throw new Error(`Failed to start browser: ${startResult.error || 'Unknown error'}`);
    }
    
    this.browserId = startResult.data.browserId;
    this.puppeteerUrl = startResult.data.puppeteerUrl;
    
    console.log(`[BOL] Browser started, ID: ${this.browserId}`);
    
    // Connect to browser and get IP address
    const puppeteer = await import('puppeteer-core');
    const cloudBrowserApiKey = process.env.CLOUD_BROWSER_API_KEY!;
    const wsUrl = `${this.puppeteerUrl}?x_api_key=${cloudBrowserApiKey}`;
    
    this.currentBrowser = await puppeteer.default.connect({
      browserWSEndpoint: wsUrl,
    });
    
    const pages = await this.currentBrowser.pages();
    this.currentPage = pages[0] || await this.currentBrowser.newPage();
    
    // Detect IP address
    try {
      await this.currentPage.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 10000 });
      const ipData = await this.currentPage.evaluate(() => document.body.textContent);
      const parsed = JSON.parse(ipData);
      this.ipAddress = parsed.ip;
      console.log(`[BOL] Detected IP: ${this.ipAddress}`);
    } catch (error) {
      console.log(`[BOL] Could not detect IP address`);
    }
  }

  async searchProducts(keyword: string, sponsoredOnly: boolean = false): Promise<Seller[]> {
    if (!this.currentPage) {
      throw new Error('Browser not initialized');
    }

    console.log(`[BOL] Searching for: ${keyword} (sponsored: ${sponsoredOnly})`);
    
    const page = this.currentPage;
    
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
    
    if (sellers.length === 0) {
      throw new Error('No third-party sellers found');
    }
    
    return sellers;
  }

  async contactSeller(seller: Seller, messageData: any, keyword: string): Promise<ContactResult> {
    console.log(`[BOL] Would contact: ${seller.name}`);
    
    const timestamp = new Date().toISOString();
    let screenshotPath: string | null = null;
    
    try {
      // Take screenshot
      if (this.currentPage) {
        const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        const filename = `${Date.now()}-${seller.name.replace(/[^a-z0-9]/gi, '_')}.png`;
        const fullPath = path.join(screenshotsDir, filename);
        
        await this.currentPage.screenshot({ 
          path: fullPath,
          fullPage: false,
          type: 'png'
        });
        
        screenshotPath = `/screenshots/${filename}`;
        console.log(`[BOL] Screenshot saved: ${screenshotPath}`);
      }
      
      // Log to database
      const logEntry: MessageLog = {
        shop_name: seller.name,
        product_title: seller.productTitle,
        keyword: keyword,
        message: messageData.message,
        subject: messageData.subject,
        sender_name: messageData.name,
        sender_email: messageData.email,
        sender_phone: messageData.phone || '',
        screenshot_path: screenshotPath,
        adspower_profile: this.profileId,
        ip_address: this.ipAddress,
        status: 'sent',
        error_message: null,
        timestamp: timestamp,
      };
      
      insertMessageLog(logEntry);
      console.log(`[BOL] Message logged to database`);
      
      return {
        seller: seller.name,
        success: true,
        timestamp,
        screenshotPath: screenshotPath || undefined,
      };
    } catch (error: any) {
      console.error(`[BOL] Error contacting seller:`, error);
      
      // Log failed attempt
      const logEntry: MessageLog = {
        shop_name: seller.name,
        product_title: seller.productTitle,
        keyword: keyword,
        message: messageData.message,
        subject: messageData.subject,
        sender_name: messageData.name,
        sender_email: messageData.email,
        sender_phone: messageData.phone || '',
        screenshot_path: null,
        adspower_profile: this.profileId,
        ip_address: this.ipAddress,
        status: 'failed',
        error_message: error.message,
        timestamp: timestamp,
      };
      
      insertMessageLog(logEntry);
      
      throw error;
    }
  }

  async cleanup() {
    if (this.currentBrowser) {
      try {
        await this.currentBrowser.disconnect();
        console.log(`[BOL] Browser disconnected`);
      } catch (error) {
        console.error(`[BOL] Error disconnecting browser:`, error);
      }
    }
    
    if (this.browserId) {
      console.log(`[BOL] Stopping browser ${this.browserId}`);
      try {
        await this.cloudBrowser.stopBrowser(this.browserId, 'adspower');
      } catch (error) {
        console.error(`[BOL] Error stopping browser:`, error);
      }
    }
  }
}
