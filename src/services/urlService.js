/**
 * URL Service for managing URL shortening operations
 * Handles URL validation, shortcode generation, and data persistence
 */

import logger from '../utils/logger';

class URLService {
  constructor() {
    this.urls = new Map(); // Store shortened URLs
    this.clickData = new Map(); // Store click analytics
    this.shortcodeCounter = 1; // Counter for auto-generated shortcodes
    this.usedShortcodes = new Set(); // Track used shortcodes for uniqueness
    
    // Load data from localStorage on initialization
    this.loadFromStorage();
    
    logger.info('URL Service initialized');
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  validateURL(url) {
    try {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        logger.warn('Invalid URL format', { url });
        return false;
      }
      
      new URL(url); // This will throw if URL is malformed
      logger.debug('URL validation successful', { url });
      return true;
    } catch (error) {
      logger.error('URL validation failed', { url, error: error.message });
      return false;
    }
  }

  /**
   * Validate shortcode format
   * @param {string} shortcode - Shortcode to validate
   * @returns {boolean} True if valid shortcode
   */
  validateShortcode(shortcode) {
    const shortcodePattern = /^[a-zA-Z0-9]{3,20}$/;
    const isValid = shortcodePattern.test(shortcode);
    
    if (!isValid) {
      logger.warn('Invalid shortcode format', { shortcode });
    } else {
      logger.debug('Shortcode validation successful', { shortcode });
    }
    
    return isValid;
  }

  /**
   * Check if shortcode is available
   * @param {string} shortcode - Shortcode to check
   * @returns {boolean} True if available
   */
  isShortcodeAvailable(shortcode) {
    const isAvailable = !this.usedShortcodes.has(shortcode);
    
    if (!isAvailable) {
      logger.warn('Shortcode already in use', { shortcode });
    }
    
    return isAvailable;
  }

  /**
   * Generate a unique shortcode
   * @returns {string} Generated shortcode
   */
  generateShortcode() {
    let shortcode;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Generate a random shortcode
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      shortcode = '';
      for (let i = 0; i < 6; i++) {
        shortcode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
    } while (this.usedShortcodes.has(shortcode) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based shortcode
      shortcode = 'url' + Date.now().toString(36);
      logger.warn('Using fallback shortcode generation', { shortcode });
    }

    this.usedShortcodes.add(shortcode);
    logger.info('Generated new shortcode', { shortcode });
    return shortcode;
  }

  /**
   * Create a shortened URL
   * @param {string} originalUrl - Original URL to shorten
   * @param {number} validityMinutes - Validity period in minutes (default: 30)
   * @param {string} customShortcode - Optional custom shortcode
   * @returns {object} Result object with success status and data/error
   */
  createShortURL(originalUrl, validityMinutes = 30, customShortcode = null) {
    logger.info('Creating short URL', { originalUrl, validityMinutes, customShortcode });

    // Validate original URL
    if (!this.validateURL(originalUrl)) {
      return {
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.'
      };
    }

    // Validate validity period
    if (!Number.isInteger(validityMinutes) || validityMinutes <= 0) {
      return {
        success: false,
        error: 'Validity period must be a positive integer (minutes).'
      };
    }

    let shortcode;

    // Handle custom shortcode
    if (customShortcode) {
      if (!this.validateShortcode(customShortcode)) {
        return {
          success: false,
          error: 'Invalid shortcode format. Use 3-20 alphanumeric characters.'
        };
      }

      if (!this.isShortcodeAvailable(customShortcode)) {
        return {
          success: false,
          error: 'Shortcode already in use. Please choose a different one.'
        };
      }

      shortcode = customShortcode;
    } else {
      shortcode = this.generateShortcode();
    }

    // Calculate expiry time
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60 * 1000);

    // Store the URL data
    const urlData = {
      id: Date.now().toString(),
      originalUrl,
      shortcode,
      shortUrl: `${window.location.origin}/${shortcode}`,
      createdAt,
      expiresAt,
      validityMinutes,
      clickCount: 0,
      clicks: []
    };

    this.urls.set(shortcode, urlData);
    this.clickData.set(shortcode, []);

    // Save to localStorage
    this.saveToStorage();

    logger.info('Short URL created successfully', { 
      shortcode, 
      originalUrl, 
      expiresAt: expiresAt.toISOString() 
    });

    return {
      success: true,
      data: urlData
    };
  }

  /**
   * Get original URL by shortcode
   * @param {string} shortcode - Shortcode to look up
   * @returns {object} Result object with success status and data/error
   */
  getOriginalURL(shortcode) {
    logger.info('Looking up original URL', { shortcode });
    logger.debug('Available shortcodes', { shortcodes: Array.from(this.urls.keys()) });

    const urlData = this.urls.get(shortcode);
    
    if (!urlData) {
      logger.warn('Shortcode not found', { shortcode, availableShortcodes: Array.from(this.urls.keys()) });
      return {
        success: false,
        error: 'Short URL not found.'
      };
    }

    logger.debug('URL data found', { urlData });

    // Check if URL has expired
    const now = new Date();
    if (now > urlData.expiresAt) {
      logger.warn('Short URL has expired', { shortcode, expiresAt: urlData.expiresAt, currentTime: now });
      return {
        success: false,
        error: 'Short URL has expired.'
      };
    }

    // Record click
    this.recordClick(shortcode);

    logger.info('Original URL retrieved successfully', { shortcode, originalUrl: urlData.originalUrl });
    
    return {
      success: true,
      data: urlData
    };
  }

  /**
   * Record a click on a short URL
   * @param {string} shortcode - Shortcode that was clicked
   */
  recordClick(shortcode) {
    const urlData = this.urls.get(shortcode);
    if (!urlData) return;

    const clickData = {
      timestamp: new Date(),
      source: this.getClickSource(),
      location: this.getClickLocation()
    };

    urlData.clickCount++;
    urlData.clicks.push(clickData);
    this.clickData.get(shortcode).push(clickData);

    // Save to localStorage
    this.saveToStorage();

    logger.info('Click recorded', { shortcode, clickCount: urlData.clickCount });
  }

  /**
   * Get click source (simplified for client-side)
   * @returns {string} Click source
   */
  getClickSource() {
    return document.referrer || 'Direct';
  }

  /**
   * Get click location (simplified for client-side)
   * @returns {string} Click location
   */
  getClickLocation() {
    // In a real application, this would use a geolocation service
    return 'Unknown';
  }

  /**
   * Get all shortened URLs
   * @returns {Array} Array of all URL data
   */
  getAllURLs() {
    const allURLs = Array.from(this.urls.values());
    logger.info('Retrieved all URLs', { count: allURLs.length });
    return allURLs;
  }

  /**
   * Get URL statistics by shortcode
   * @param {string} shortcode - Shortcode to get stats for
   * @returns {object} Statistics data
   */
  getURLStats(shortcode) {
    const urlData = this.urls.get(shortcode);
    if (!urlData) {
      return null;
    }

    const stats = {
      ...urlData,
      clicks: this.clickData.get(shortcode) || []
    };

    logger.info('Retrieved URL statistics', { shortcode, clickCount: stats.clickCount });
    return stats;
  }

  /**
   * Clean up expired URLs
   */
  cleanupExpiredURLs() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [shortcode, urlData] of this.urls.entries()) {
      if (now > urlData.expiresAt) {
        this.urls.delete(shortcode);
        this.clickData.delete(shortcode);
        this.usedShortcodes.delete(shortcode);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      // Save to localStorage after cleanup
      this.saveToStorage();
      logger.info('Cleaned up expired URLs', { count: cleanedCount });
    }
  }

  /**
   * Debug method to get all stored URLs
   * @returns {Array} Array of all URL data for debugging
   */
  debugGetAllURLs() {
    const allURLs = Array.from(this.urls.entries()).map(([shortcode, data]) => ({
      shortcode,
      originalUrl: data.originalUrl,
      shortUrl: data.shortUrl,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      isExpired: new Date() > data.expiresAt
    }));
    
    logger.info('Debug: All stored URLs', { urls: allURLs });
    return allURLs;
  }

  /**
   * Save data to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        urls: Array.from(this.urls.entries()),
        clickData: Array.from(this.clickData.entries()),
        usedShortcodes: Array.from(this.usedShortcodes)
      };
      localStorage.setItem('urlShortenerData', JSON.stringify(data));
      logger.debug('Data saved to localStorage');
    } catch (error) {
      logger.error('Failed to save data to localStorage', { error: error.message });
    }
  }

  /**
   * Load data from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('urlShortenerData');
      if (data) {
        const parsedData = JSON.parse(data);
        
        // Restore URLs
        this.urls = new Map(parsedData.urls || []);
        
        // Restore click data
        this.clickData = new Map(parsedData.clickData || []);
        
        // Restore used shortcodes
        this.usedShortcodes = new Set(parsedData.usedShortcodes || []);
        
        logger.info('Data loaded from localStorage', { 
          urlCount: this.urls.size,
          shortcodeCount: this.usedShortcodes.size 
        });
      }
    } catch (error) {
      logger.error('Failed to load data from localStorage', { error: error.message });
    }
  }
}

// Create singleton instance
const urlService = new URLService();

// Clean up expired URLs every 5 minutes
setInterval(() => {
  urlService.cleanupExpiredURLs();
}, 5 * 60 * 1000);

export default urlService;