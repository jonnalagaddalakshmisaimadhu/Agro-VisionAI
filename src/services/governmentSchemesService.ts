const API_BASE_URL = '/api/schemes';

export interface GovernmentScheme {
  id: number;
  name: string;
  description: string;
  eligibility_criteria: string;
  benefits: string;
  subsidy_percentage: string;
  category: string;
  sector: string;
  applicable_states: string[];
  applicable_crops: string[];
  application_process: string;
  required_documents: string[];
  contact_info: Record<string, string>;
  website_url: string;
  official_apply_url: string;
  is_active: boolean;
  is_new: boolean;
  expiry_date: string;
  created_at: string;
  last_refreshed: string;
}

export interface RefreshStatus {
  last_refresh: string | null;
  next_refresh: string | null;
  status: string;
  new_schemes?: number;
  updated_schemes?: number;
  error_message?: string;
}

export interface NewScheme {
  id: number;
  name: string;
  description: string;
  category: string;
  benefits: string;
  subsidy_percentage: string;
  official_apply_url: string;
  created_at: string;
}

class GovernmentSchemesService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Return fallback data for schemes if API fails
      if (endpoint === '/schemes' || endpoint === '') {
        return this.getFallbackSchemes() as T;
      }
      throw error;
    }
  }

  private getFallbackSchemes(): GovernmentScheme[] {
    return [
      {
        id: 1,
        name: "PM-KISAN Samman Nidhi Yojana",
        description: "Direct income support to farmers providing ₹6000 per year in three installments",
        eligibility_criteria: "Small and marginal farmers with landholding up to 2 hectares",
        benefits: "₹6,000 per year",
        subsidy_percentage: "100%",
        category: "Direct Benefit Transfer",
        sector: "Government",
        applicable_states: ["All India"],
        applicable_crops: ["All Crops"],
        application_process: "Online application through PM-KISAN portal",
        required_documents: ["Aadhaar Card", "Land Documents", "Bank Account Details"],
        contact_info: { phone: "1800-180-1551", email: "pmkisan@gov.in" },
        website_url: "https://pmkisan.gov.in",
        official_apply_url: "https://pmkisan.gov.in/NewRegistration.aspx",
        is_active: true,
        is_new: false,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        last_refreshed: new Date().toISOString()
      },
      {
        id: 2,
        name: "Pradhan Mantri Fasal Bima Yojana",
        description: "Crop insurance scheme providing financial support against crop loss",
        eligibility_criteria: "All farmers growing notified crops in notified areas",
        benefits: "Up to ₹2 lakh coverage",
        subsidy_percentage: "Premium subsidy up to 50%",
        category: "Insurance",
        sector: "Government",
        applicable_states: ["All India"],
        applicable_crops: ["Rice", "Wheat", "Cotton", "Sugarcane"],
        application_process: "Apply through insurance companies",
        required_documents: ["Aadhaar Card", "Land Documents", "Crop Details"],
        contact_info: { phone: "1800-180-1552", email: "fasalbima@gov.in" },
        website_url: "https://fasalbima.gov.in",
        official_apply_url: "https://fasalbima.gov.in/apply",
        is_active: true,
        is_new: false,
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        last_refreshed: new Date().toISOString()
      }
    ];
  }

  async getSchemes(params?: {
    category?: string;
    state?: string;
    crop?: string;
    sector?: string;
    active_only?: boolean;
  }): Promise<GovernmentScheme[]> {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.append('category', params.category);
    if (params?.state) searchParams.append('state', params.state);
    if (params?.crop) searchParams.append('crop', params.crop);
    if (params?.sector) searchParams.append('sector', params.sector);
    if (params?.active_only !== undefined) searchParams.append('active_only', params.active_only.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/schemes?${queryString}` : '/schemes';

    return this.makeRequest<GovernmentScheme[]>(endpoint);
  }

  async getSchemeById(schemeId: number): Promise<GovernmentScheme> {
    return this.makeRequest<GovernmentScheme>(`/schemes/${schemeId}`);
  }

  async getNewSchemes(limit: number = 10): Promise<NewScheme[]> {
    return this.makeRequest<NewScheme[]>(`/new-schemes?limit=${limit}`);
  }

  async getRefreshStatus(): Promise<RefreshStatus> {
    return this.makeRequest<RefreshStatus>('/refresh-status');
  }

  async refreshSchemes(): Promise<{ message: string; status: string }> {
    return this.makeRequest<{ message: string; status: string }>('/refresh-schemes', {
      method: 'POST',
    });
  }

  async markNewSchemesSeen(): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>('/mark-new-schemes-seen', {
      method: 'POST',
    });
  }

  async getCategories(): Promise<{ categories: Array<{ id: string; name: string }> }> {
    try {
      return await this.makeRequest<{ categories: Array<{ id: string; name: string }> }>('/categories');
    } catch (error) {
      console.error('Failed to fetch categories, using fallback data:', error);
      return {
        categories: [
          { id: "Direct Benefit Transfer", name: "Direct Benefit Transfer" },
          { id: "Insurance", name: "Insurance" },
          { id: "Credit/Loan", name: "Credit/Loan" },
          { id: "Equipment", name: "Equipment" },
          { id: "Soil Management", name: "Soil Management" },
          { id: "Sustainable Agriculture", name: "Sustainable Agriculture" },
          { id: "Digital Agriculture", name: "Digital Agriculture" }
        ]
      };
    }
  }

  async getStates(): Promise<{ states: string[] }> {
    try {
      return await this.makeRequest<{ states: string[] }>('/states');
    } catch (error) {
      console.error('Failed to fetch states, using fallback data:', error);
      return {
        states: [
          "All India", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
          "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
          "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
          "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
          "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
          "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
        ]
      };
    }
  }

  openOfficialSite(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  openApplySite(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

export const governmentSchemesService = new GovernmentSchemesService();
