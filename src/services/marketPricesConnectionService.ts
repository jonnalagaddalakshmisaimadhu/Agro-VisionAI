import { MarketPrice, PriceTrend, MarketStats } from './marketPricesService';

// Connection states
export enum ConnectionState {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  DEGRADED = 'degraded'
}

// Circuit breaker states
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache entries
  staleWhileRevalidate: number; // Serve stale data while revalidating
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number;
}

// Connection health metrics
interface ConnectionMetrics {
  successCount: number;
  failureCount: number;
  lastSuccessTime: number;
  lastFailureTime: number;
  averageResponseTime: number;
  circuitBreakerState: CircuitBreakerState;
}

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

class MarketPricesConnectionService {
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private metrics: ConnectionMetrics;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private retryQueue: Array<() => Promise<any>> = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;

  // Configuration
  private readonly cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    staleWhileRevalidate: 2 * 60 * 1000 // 2 minutes
  };

  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  };

  private readonly circuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    halfOpenMaxCalls: 3
  };

  constructor() {
    this.metrics = {
      successCount: 0,
      failureCount: 0,
      lastSuccessTime: 0,
      lastFailureTime: 0,
      averageResponseTime: 0,
      circuitBreakerState: CircuitBreakerState.CLOSED
    };

    this.startHealthMonitoring();
    this.startCacheCleanup();
  }

  /**
   * Main method to fetch market prices with intelligent connection handling
   */
  async fetchMarketPrices(params?: {
    category?: string;
    location?: string;
    limit?: number;
    verified_only?: boolean;
  }): Promise<MarketPrice[]> {
    const cacheKey = this.generateCacheKey('market_prices', params);
    
    // Try to get from cache first
    const cachedData = this.getFromCache<MarketPrice[]>(cacheKey);
    if (cachedData && this.isCacheValid(cachedData)) {
      this.updateMetrics(true, Date.now() - cachedData.timestamp);
      return cachedData.data;
    }

    // Serve stale data if available while revalidating
    if (cachedData && this.isStaleButRevalidating(cachedData)) {
      this.revalidateInBackground(cacheKey, params);
      return cachedData.data;
    }

    // Fetch fresh data
    return this.fetchWithRetry(() => this.fetchFreshPrices(params), cacheKey);
  }

  /**
   * Fetch price trends with connection handling
   */
  async fetchPriceTrends(params?: {
    crop_name?: string;
    days?: number;
  }): Promise<PriceTrend[]> {
    const cacheKey = this.generateCacheKey('price_trends', params);
    
    const cachedData = this.getFromCache<PriceTrend[]>(cacheKey);
    if (cachedData && this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    return this.fetchWithRetry(() => this.fetchFreshTrends(params), cacheKey);
  }

  /**
   * Fetch market statistics with connection handling
   */
  async fetchMarketStats(): Promise<MarketStats> {
    const cacheKey = this.generateCacheKey('market_stats');
    
    const cachedData = this.getFromCache<MarketStats>(cacheKey);
    if (cachedData && this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    return this.fetchWithRetry(() => this.fetchFreshStats(), cacheKey);
  }

  /**
   * Search crops with intelligent caching and connection handling
   */
  async searchCrops(searchTerm: string, params?: {
    category?: string;
    location?: string;
    limit?: number;
  }): Promise<MarketPrice[]> {
    const cacheKey = this.generateCacheKey('search', { searchTerm, ...params });
    
    const cachedData = this.getFromCache<MarketPrice[]>(cacheKey);
    if (cachedData && this.isCacheValid(cachedData)) {
      return cachedData.data;
    }

    return this.fetchWithRetry(() => this.fetchSearchResults(searchTerm, params), cacheKey);
  }

  /**
   * Core retry mechanism with exponential backoff and circuit breaker
   */
  private async fetchWithRetry<T>(
    fetchFunction: () => Promise<T>,
    cacheKey: string
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      if (Date.now() - this.metrics.lastFailureTime > this.circuitBreakerConfig.recoveryTimeout) {
        this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
      } else {
        return this.getFallbackData<T>(cacheKey);
      }
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        this.setConnectionState(ConnectionState.CONNECTING);
        
        const result = await this.executeWithTimeout(fetchFunction, 10000); // 10 second timeout
        
        const responseTime = Date.now() - startTime;
        this.updateMetrics(true, responseTime);
        this.setConnectionState(ConnectionState.CONNECTED);
        
        // Cache the successful result
        this.setCache(cacheKey, result);
        
        // Reset circuit breaker on success
        if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
          this.circuitBreakerState = CircuitBreakerState.CLOSED;
        }
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        this.updateMetrics(false, 0);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
            this.retryConfig.maxDelay
          );
          
          await this.sleep(delay);
        }
      }
    }
    
    // All retries failed
    this.handleCircuitBreakerFailure();
    this.setConnectionState(ConnectionState.ERROR);
    
    // Return fallback data
    return this.getFallbackData<T>(cacheKey);
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Fetch fresh prices from API
   */
  private async fetchFreshPrices(params?: any): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.category) searchParams.append('category', params.category);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.verified_only) searchParams.append('verified_only', params.verified_only.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices?${queryString}` : '/prices';
    
    const response = await fetch(`/api/market-prices${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FarmIQ-Enhanced/1.0',
        'X-Request-ID': this.generateRequestId()
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.validateAndSanitizePrices(data);
  }

  /**
   * Fetch fresh trends from API
   */
  private async fetchFreshTrends(params?: any): Promise<PriceTrend[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.crop_name) searchParams.append('crop_name', params.crop_name);
    if (params?.days) searchParams.append('days', params.days.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices/trends?${queryString}` : '/prices/trends';
    
    const response = await fetch(`/api/market-prices${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FarmIQ-Enhanced/1.0',
        'X-Request-ID': this.generateRequestId()
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch fresh stats from API
   */
  private async fetchFreshStats(): Promise<MarketStats> {
    const response = await fetch('/api/market-prices/prices/stats/summary', {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FarmIQ-Enhanced/1.0',
        'X-Request-ID': this.generateRequestId()
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch search results from API
   */
  private async fetchSearchResults(searchTerm: string, params?: any): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    
    searchParams.append('search', searchTerm);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.location) searchParams.append('location', params.location);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `/prices/search?${queryString}`;
    
    const response = await fetch(`/api/market-prices${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FarmIQ-Enhanced/1.0',
        'X-Request-ID': this.generateRequestId()
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return this.validateAndSanitizePrices(data);
  }

  /**
   * Validate and sanitize price data
   */
  private validateAndSanitizePrices(prices: any[]): MarketPrice[] {
    return prices.filter(price => {
      // Basic validation
      return price &&
             typeof price.crop_name === 'string' &&
             typeof price.current_price === 'number' &&
             price.current_price > 0 &&
             typeof price.category === 'string' &&
             typeof price.market_location === 'string';
    }).map(price => ({
      ...price,
      // Sanitize string fields
      crop_name: price.crop_name.trim(),
      category: price.category.toLowerCase().trim(),
      market_location: price.market_location.trim(),
      // Ensure numeric fields are valid
      current_price: Math.max(0, Number(price.current_price)),
      previous_price: price.previous_price ? Math.max(0, Number(price.previous_price)) : undefined,
      price_change: price.price_change ? Number(price.price_change) : undefined,
      // Ensure boolean fields
      is_verified: Boolean(price.is_verified),
      // Ensure required fields have defaults
      unit: price.unit || 'kg',
      market_type: price.market_type || 'wholesale',
      quality_grade: price.quality_grade || 'A',
      status: price.status || 'active',
      trend: price.trend || 'stable'
    }));
  }

  /**
   * Generate intelligent fallback data
   */
  private getFallbackData<T>(cacheKey: string): T {
    // Try to get stale data from cache
    const cachedData = this.getFromCache<T>(cacheKey);
    if (cachedData) {
      return cachedData.data;
    }

    // Generate fresh fallback data based on cache key
    if (cacheKey.includes('market_prices')) {
      return this.generateFallbackPrices() as T;
    } else if (cacheKey.includes('price_trends')) {
      return this.generateFallbackTrends() as T;
    } else if (cacheKey.includes('market_stats')) {
      return this.generateFallbackStats() as T;
    } else if (cacheKey.includes('search')) {
      return this.generateFallbackSearchResults() as T;
    }

    return [] as T;
  }

  /**
   * Generate realistic fallback prices with variations
   */
  private generateFallbackPrices(): MarketPrice[] {
    const basePrices = [
      { name: "Tomato", category: "vegetables", basePrice: 45, volatility: 0.15 },
      { name: "Onion", category: "vegetables", basePrice: 25, volatility: 0.20 },
      { name: "Potato", category: "vegetables", basePrice: 20, volatility: 0.10 },
      { name: "Carrot", category: "vegetables", basePrice: 30, volatility: 0.12 },
      { name: "Cabbage", category: "vegetables", basePrice: 18, volatility: 0.15 },
      { name: "Cauliflower", category: "vegetables", basePrice: 22, volatility: 0.14 },
      { name: "Brinjal", category: "vegetables", basePrice: 28, volatility: 0.16 },
      { name: "Okra", category: "vegetables", basePrice: 35, volatility: 0.18 },
      { name: "Spinach", category: "vegetables", basePrice: 15, volatility: 0.20 },
      { name: "Capsicum", category: "vegetables", basePrice: 40, volatility: 0.22 },
      { name: "Cucumber", category: "vegetables", basePrice: 25, volatility: 0.12 },
      { name: "Radish", category: "vegetables", basePrice: 20, volatility: 0.10 },
      { name: "Beetroot", category: "vegetables", basePrice: 35, volatility: 0.15 },
      { name: "Mango", category: "fruits", basePrice: 80, volatility: 0.25 },
      { name: "Banana", category: "fruits", basePrice: 35, volatility: 0.18 },
      { name: "Apple", category: "fruits", basePrice: 120, volatility: 0.20 },
      { name: "Orange", category: "fruits", basePrice: 45, volatility: 0.15 },
      { name: "Grapes", category: "fruits", basePrice: 60, volatility: 0.22 },
      { name: "Pomegranate", category: "fruits", basePrice: 90, volatility: 0.18 },
      { name: "Papaya", category: "fruits", basePrice: 25, volatility: 0.16 },
      { name: "Cotton", category: "fiber", basePrice: 6500, volatility: 0.10 }
    ];

    const locations = ["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad", "Kolkata"];
    const trends = ["up", "down", "stable"];
    
    return basePrices.map((item, index) => {
      const variation = (Math.random() - 0.5) * 2 * item.volatility;
      const currentPrice = Math.max(1, item.basePrice * (1 + variation));
      const previousPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1);
      const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
      const trend = priceChange > 2 ? "up" : priceChange < -2 ? "down" : "stable";
      
      return {
        id: index + 1,
        crop_name: item.name,
        category: item.category,
        current_price: Math.round(currentPrice * 100) / 100,
        previous_price: Math.round(previousPrice * 100) / 100,
        price_change: Math.round(priceChange * 100) / 100,
        price_change_amount: Math.round((currentPrice - previousPrice) * 100) / 100,
        unit: item.category === "fiber" ? "quintal" : "kg",
        market_location: locations[Math.floor(Math.random() * locations.length)],
        market_type: "wholesale",
        quality_grade: "A",
        trend: trend,
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      };
    });
  }

  /**
   * Generate fallback trends
   */
  private generateFallbackTrends(): PriceTrend[] {
    const crops = ["Tomato", "Onion", "Potato", "Rice", "Wheat"];
    const locations = ["Mumbai", "Delhi", "Bangalore"];
    
    return crops.map((crop, index) => ({
      crop_name: crop,
      current_price: 30 + Math.random() * 50,
      trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)],
      change_percentage: (Math.random() - 0.5) * 20,
      location: locations[Math.floor(Math.random() * locations.length)],
      last_updated: new Date().toISOString()
    }));
  }

  /**
   * Generate fallback stats
   */
  private generateFallbackStats(): MarketStats {
    return {
      total_crops: 35,
      verified_prices: 0,
      trends: {
        up: Math.floor(Math.random() * 15) + 10,
        down: Math.floor(Math.random() * 10) + 5,
        stable: Math.floor(Math.random() * 10) + 5
      },
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Generate fallback search results
   */
  private generateFallbackSearchResults(): MarketPrice[] {
    return this.generateFallbackPrices().slice(0, 5);
  }

  /**
   * Cache management methods
   */
  private getFromCache<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
      return entry as CacheEntry<T>;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.cacheConfig.ttl,
      hits: 1,
      lastAccessed: Date.now()
    });
  }

  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private isStaleButRevalidating<T>(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl && age < entry.ttl + this.cacheConfig.staleWhileRevalidate;
  }

  private generateCacheKey(prefix: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${prefix}:${paramString}`;
  }

  /**
   * Circuit breaker management
   */
  private handleCircuitBreakerFailure(): void {
    this.metrics.failureCount++;
    this.metrics.lastFailureTime = Date.now();
    
    if (this.metrics.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      this.circuitBreakerState = CircuitBreakerState.OPEN;
    }
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry on 4xx errors (client errors)
    if (error.message?.includes('HTTP 4')) {
      return true;
    }
    return false;
  }

  /**
   * Connection state management
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyConnectionStateChange(state);
    }
  }

  private notifyConnectionStateChange(state: ConnectionState): void {
    // Emit connection state change event
    window.dispatchEvent(new CustomEvent('marketPricesConnectionChange', {
      detail: { state, metrics: this.metrics }
    }));
  }

  /**
   * Metrics and monitoring
   */
  private updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successCount++;
      this.metrics.lastSuccessTime = Date.now();
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + responseTime) / 2;
    } else {
      this.metrics.failureCount++;
      this.metrics.lastFailureTime = Date.now();
    }
  }

  /**
   * Health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/market-prices/prices/stats/summary', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        this.setConnectionState(ConnectionState.CONNECTED);
        this.updateMetrics(true, Date.now() - startTime);
      } else {
        this.setConnectionState(ConnectionState.DEGRADED);
      }
    } catch (error) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.updateMetrics(false, 0);
    }
  }

  /**
   * Cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl + this.cacheConfig.staleWhileRevalidate) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Background revalidation
   */
  private async revalidateInBackground(cacheKey: string, params?: any): Promise<void> {
    try {
      const freshData = await this.fetchFreshPrices(params);
      this.setCache(cacheKey, freshData);
    } catch (error) {
      // Silently fail background revalidation
      console.warn('Background revalidation failed:', error);
    }
  }

  /**
   * Utility methods
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  getCacheStats(): { size: number; hitRate: number } {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = this.metrics.successCount + this.metrics.failureCount;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  forceReconnect(): void {
    this.circuitBreakerState = CircuitBreakerState.CLOSED;
    this.metrics.failureCount = 0;
    this.setConnectionState(ConnectionState.CONNECTING);
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const marketPricesConnectionService = new MarketPricesConnectionService();
export default marketPricesConnectionService;
