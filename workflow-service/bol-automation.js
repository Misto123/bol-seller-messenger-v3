// Simplified BOL.nl automation - visits product pages to find sellers
import puppeteer from 'puppeteer-core';

class BolAutomation {
  constructor(profileId) {
    this.profileId = profileId;
    this.browser = null;
    this.page = null;
    this.adsPowerApiUrl = process.env.ADSPOWER_API_URL || 'http://localhost:50326';
    this.adsPowerApiKey = process.env.ADSPOWER_API_KEY || '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329';
  }

  async initialize() {
    console.log(`[BOL] Initializing AdsPower profile ${this.profileId}...`);
    
    const startResponse = await fetch(
      `${this.adsPowerApiUrl}/api/v1/browser/start?user_id=${this.profileId}`,
      { headers: { 'Authorization': `Bearer ${this.adsPowerApiKey}` } }
    );
    
    const startData = await startResponse.json();
    if (startData.code !== 0) {
      throw new Error(`Failed to start browser: ${startData.msg}`);
    }
    
    const wsEndpoint = startData.data.ws.puppeteer;
    this.browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null
    });
    
    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    
    console.log(`[BOL] Browser ready`);
  }

  async searchSellers(keyword, sponsoredOnly = false) {
    console.log(`[BOL] Searching: "${keyword}" (sponsored only: ${sponsoredOnly})`);
    
    const searchUrl = `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(keyword)}`;
    await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const productLinks = await this.page.evaluate((filterSponsored) => {
      const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      const unique = new Map();
      
      links.forEach(link => {
        if (link.href && link.href.includes('/p/')) {
          // Check if product is sponsored (look for parent with sponsored indicator)
          let element = link;
          let isSponsored = false;
          
          // Walk up the DOM to find sponsored indicators
          for (let i = 0; i < 10 && element; i++) {
            const text = element.textContent || '';
            const classes = element.className || '';
            
            if (text.toLowerCase().includes('gesponsord') || 
                text.toLowerCase().includes('sponsored') ||
                classes.includes('sponsored') ||
                classes.includes('gesponsord')) {
              isSponsored = true;
              break;
            }
            element = element.parentElement;
          }
          
          // Filter based on sponsoredOnly flag
          if (!filterSponsored || isSponsored) {
            unique.set(link.href, {
              url: link.href,
              title: link.textContent.trim() || 'Product',
              sponsored: isSponsored
            });
          }
        }
      });
      
      return Array.from(unique.values());
    }, sponsoredOnly);
    
    console.log(`[BOL] Found ${productLinks.length} products${sponsoredOnly ? ' (sponsored only)' : ''}`);
    
    if (productLinks.length === 0) {
      throw new Error(sponsoredOnly ? 'No sponsored products found' : 'No products found');
    }
    
    const sellers = [];
    const maxCheck = Math.min(10, productLinks.length);
    
    for (let i = 0; i < maxCheck; i++) {
      const product = productLinks[i];
      console.log(`[BOL] Checking product ${i + 1}/${maxCheck}`);
      
      try {
        await this.page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const sellerInfo = await this.page.evaluate(() => {
          // Look for "Verkoop door" text in underlined spans
          const underlinedSpans = document.querySelectorAll('span.underline, span[class*="underline"]');
          
          for (const span of underlinedSpans) {
            const text = span.textContent.trim();
            if (text.startsWith('Verkoop door')) {
              // Extract seller name after "Verkoop door"
              const sellerName = text.replace(/^Verkoop door\s+/, '').split(/\s+(beoordeeld|rated)/)[0].trim();
              return { seller: sellerName };
            }
          }
          
          return null;
        });
        
        if (sellerInfo && sellerInfo.seller) {
          const sellerLower = sellerInfo.seller.toLowerCase();
          
          if (!sellerLower.includes('bol.com') && !sellerLower.includes('bol ')) {
            console.log(`[BOL] Found: ${sellerInfo.seller}`);
            sellers.push({
              name: sellerInfo.seller,
              productTitle: product.title,
              productUrl: product.url,
              sponsored: product.sponsored || false
            });
            
            if (sellers.length >= 2) break;
          } else {
            console.log(`[BOL] BOL direct, skipping`);
          }
        } else {
          console.log(`[BOL] No seller info found`);
        }
      } catch (error) {
        console.log(`[BOL] Error on product ${i + 1}: ${error.message}`);
      }
    }
    
    if (sellers.length === 0) {
      throw new Error('No third-party sellers found');
    }
    
    return sellers;
  }

  async contactSeller(seller, messageData) {
    console.log(`[BOL] Would contact: ${seller.name}`);
    return {
      seller: seller.name,
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.disconnect();
    }
  }
}

export default BolAutomation;
