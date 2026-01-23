import marketPricesConnectionService from './marketPricesConnectionService';

const API_BASE_URL = '/api/market-prices';

export interface MarketPrice {
  id: number;
  crop_name: string;
  category: string;
  current_price: number;
  previous_price?: number;
  price_change?: number;
  price_change_amount?: number;
  unit: string;
  market_location: string;
  market_type: string;
  quality_grade: string;
  trend?: string;
  status: string;
  source?: string;
  last_updated: string;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  demand_level?: string;
  supply_level?: string;
  market_insights?: string;
  is_verified: boolean;
}

export interface PriceTrend {
  crop_name: string;
  current_price: number;
  trend: string;
  change_percentage: number;
  location: string;
  last_updated: string;
}

export interface PriceAlert {
  id: number;
  crop_name: string;
  alert_type: string;
  target_price: number;
  current_price?: number;
  is_active: boolean;
  created_at: string;
  triggered_at?: string;
}

export interface MarketStats {
  total_crops: number;
  verified_prices: number;
  trends: {
    up: number;
    down: number;
    stable: number;
  };
  last_updated: string;
}

class MarketPricesService {
  // Use the powerful connection service for all API calls
  private async fetchFromAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FarmIQ-Enhanced/1.0',
          'X-Request-ID': this.generateRequestId(),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      // Return fallback data for market prices
      if (endpoint.includes('/prices') && !endpoint.includes('/alerts')) {
        return this.getFallbackMarketPrices() as T;
      }
      throw error;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFallbackMarketPrices(): MarketPrice[] {
    return [
      // Vegetables
      {
        id: 1,
        crop_name: "Tomato",
        category: "vegetables",
        current_price: 45,
        previous_price: 42,
        price_change: 7.1,
        price_change_amount: 3,
        unit: "kg",
        market_location: "Mumbai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 2,
        crop_name: "Onion",
        category: "vegetables",
        current_price: 25,
        previous_price: 28,
        price_change: -10.7,
        price_change_amount: -3,
        unit: "kg",
        market_location: "Delhi",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 3,
        crop_name: "Potato",
        category: "vegetables",
        current_price: 20,
        previous_price: 18,
        price_change: 11.1,
        price_change_amount: 2,
        unit: "kg",
        market_location: "Bangalore",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 4,
        crop_name: "Carrot",
        category: "vegetables",
        current_price: 30,
        previous_price: 28,
        price_change: 7.1,
        price_change_amount: 2,
        unit: "kg",
        market_location: "Pune",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 5,
        crop_name: "Cabbage",
        category: "vegetables",
        current_price: 18,
        previous_price: 20,
        price_change: -10.0,
        price_change_amount: -2,
        unit: "kg",
        market_location: "Hyderabad",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 6,
        crop_name: "Cauliflower",
        category: "vegetables",
        current_price: 22,
        previous_price: 20,
        price_change: 10.0,
        price_change_amount: 2,
        unit: "kg",
        market_location: "Chennai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 7,
        crop_name: "Brinjal",
        category: "vegetables",
        current_price: 28,
        previous_price: 28,
        price_change: 0,
        price_change_amount: 0,
        unit: "kg",
        market_location: "Kolkata",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "stable",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 8,
        crop_name: "Okra",
        category: "vegetables",
        current_price: 35,
        previous_price: 32,
        price_change: 9.4,
        price_change_amount: 3,
        unit: "kg",
        market_location: "Mumbai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 9,
        crop_name: "Spinach",
        category: "vegetables",
        current_price: 15,
        previous_price: 16,
        price_change: -6.3,
        price_change_amount: -1,
        unit: "kg",
        market_location: "Pune",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 10,
        crop_name: "Capsicum",
        category: "vegetables",
        current_price: 40,
        previous_price: 35,
        price_change: 14.3,
        price_change_amount: 5,
        unit: "kg",
        market_location: "Bangalore",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 11,
        crop_name: "Cucumber",
        category: "vegetables",
        current_price: 25,
        previous_price: 25,
        price_change: 0,
        price_change_amount: 0,
        unit: "kg",
        market_location: "Delhi",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "stable",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 12,
        crop_name: "Radish",
        category: "vegetables",
        current_price: 20,
        previous_price: 19,
        price_change: 5.3,
        price_change_amount: 1,
        unit: "kg",
        market_location: "Chennai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 13,
        crop_name: "Beetroot",
        category: "vegetables",
        current_price: 35,
        previous_price: 38,
        price_change: -7.9,
        price_change_amount: -3,
        unit: "kg",
        market_location: "Hyderabad",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },

      // Fruits
      {
        id: 14,
        crop_name: "Mango",
        category: "fruits",
        current_price: 80,
        previous_price: 75,
        price_change: 6.7,
        price_change_amount: 5,
        unit: "kg",
        market_location: "Mumbai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 15,
        crop_name: "Banana",
        category: "fruits",
        current_price: 35,
        previous_price: 32,
        price_change: 9.4,
        price_change_amount: 3,
        unit: "kg",
        market_location: "Delhi",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 16,
        crop_name: "Apple",
        category: "fruits",
        current_price: 120,
        previous_price: 125,
        price_change: -4.0,
        price_change_amount: -5,
        unit: "kg",
        market_location: "Bangalore",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 17,
        crop_name: "Orange",
        category: "fruits",
        current_price: 45,
        previous_price: 45,
        price_change: 0,
        price_change_amount: 0,
        unit: "kg",
        market_location: "Pune",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "stable",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 18,
        crop_name: "Grapes",
        category: "fruits",
        current_price: 60,
        previous_price: 55,
        price_change: 9.1,
        price_change_amount: 5,
        unit: "kg",
        market_location: "Chennai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 19,
        crop_name: "Pomegranate",
        category: "fruits",
        current_price: 90,
        previous_price: 95,
        price_change: -5.3,
        price_change_amount: -5,
        unit: "kg",
        market_location: "Hyderabad",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "down",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },
      {
        id: 20,
        crop_name: "Papaya",
        category: "fruits",
        current_price: 25,
        previous_price: 23,
        price_change: 8.7,
        price_change_amount: 2,
        unit: "kg",
        market_location: "Kolkata",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      },

      // Cotton/Fiber
      {
        id: 21,
        crop_name: "Cotton",
        category: "fiber",
        current_price: 6500,
        previous_price: 6200,
        price_change: 4.8,
        price_change_amount: 300,
        unit: "quintal",
        market_location: "Mumbai",
        market_type: "wholesale",
        quality_grade: "A",
        trend: "up",
        status: "active",
        source: "fallback",
        last_updated: new Date().toISOString(),
        is_verified: false
      }
    ];
  }

  // Get all market prices with optional filters using powerful connection service
  async getMarketPrices(params?: {
    category?: string;
    location?: string;
    limit?: number;
    verified_only?: boolean;
  }): Promise<MarketPrice[]> {
    return marketPricesConnectionService.fetchMarketPrices(params);
  }

  // Get vegetable prices specifically
  async getVegetablePrices(params?: {
    location?: string;
    limit?: number;
  }): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.location) searchParams.append('location', params.location);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices/vegetables?${queryString}` : '/prices/vegetables';
    
    return this.fetchFromAPI<MarketPrice[]>(endpoint);
  }

  // Get fruit prices specifically
  async getFruitPrices(params?: {
    location?: string;
    limit?: number;
  }): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.location) searchParams.append('location', params.location);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices/fruits?${queryString}` : '/prices/fruits';
    
    return this.fetchFromAPI<MarketPrice[]>(endpoint);
  }


  // Get fiber prices specifically (cotton, etc.)
  async getFiberPrices(params?: {
    location?: string;
    limit?: number;
  }): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.location) searchParams.append('location', params.location);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices/fiber?${queryString}` : '/prices/fiber';
    
    return this.fetchFromAPI<MarketPrice[]>(endpoint);
  }

  // Search crops using powerful connection service
  async searchCrops(searchTerm: string, params?: {
    category?: string;
    location?: string;
    limit?: number;
  }): Promise<MarketPrice[]> {
    return marketPricesConnectionService.searchCrops(searchTerm, params);
  }

  // Get prices for a specific crop
  async getCropPrices(cropName: string, location?: string): Promise<MarketPrice[]> {
    const searchParams = new URLSearchParams();
    if (location) searchParams.append('location', location);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/prices/${encodeURIComponent(cropName)}?${queryString}` : `/prices/${encodeURIComponent(cropName)}`;
    
    return this.fetchFromAPI<MarketPrice[]>(endpoint);
  }

  // Get price trends using powerful connection service
  async getPriceTrends(params?: {
    crop_name?: string;
    days?: number;
  }): Promise<PriceTrend[]> {
    return marketPricesConnectionService.fetchPriceTrends(params);
  }

  // Refresh market prices
  async refreshMarketPrices(): Promise<{ message: string; status: string; timestamp: string }> {
    return this.fetchFromAPI<{ message: string; status: string; timestamp: string }>('/prices/refresh', {
      method: 'POST',
    });
  }

  // Get market statistics using powerful connection service
  async getMarketStats(): Promise<MarketStats> {
    return marketPricesConnectionService.fetchMarketStats();
  }

  // Price Alerts
  async createPriceAlert(alert: {
    crop_name: string;
    alert_type: string;
    target_price: number;
  }): Promise<PriceAlert> {
    return this.fetchFromAPI<PriceAlert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  async getPriceAlerts(): Promise<PriceAlert[]> {
    return this.fetchFromAPI<PriceAlert[]>('/alerts');
  }

  async deletePriceAlert(alertId: number): Promise<{ message: string }> {
    return this.fetchFromAPI<{ message: string }>(`/alerts/${alertId}`, {
      method: 'DELETE',
    });
  }

  // Helper method to format price for display
  formatPrice(price: number, unit: string = 'kg'): string {
    return `₹${price.toFixed(0)}/${unit}`;
  }

  // Helper method to get trend color
  getTrendColor(trend?: string): string {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  // Helper method to get trend icon
  getTrendIcon(trend?: string): string {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '➡️';
      default:
        return '➡️';
    }
  }

  // Helper method to get change percentage display
  formatChangePercentage(change?: number): string {
    if (change === undefined || change === null) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }
}

export const marketPricesService = new MarketPricesService();
