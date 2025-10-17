// frontend/src/API/api.ts
const API_BASE_URL = 'http://localhost:3000/api';

export type WebhookEvent = 
  | 'user.registered'
  | 'user.logged_in' 
  | 'listing.created'
  | 'listing.updated'
  | 'listing.deleted'
  | 'otp.requested'
  | 'otp.verified'
  | 'favorite.added'
  | 'favorite.removed'
  | 'contact.requested'
  | 'user.updated'
  | 'user.deleted';

// Response interfaces
interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  nodeVersion: string;
  redis: string;
  database: string;
}

interface UsersResponse {
  users: any[];
}

interface AuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

interface TestConnectionResults {
  health: HealthResponse | null;
  users: any[] | null;
  error: string | null;
}

/**
 * Main API service for RHomes application
 * Handles all HTTP requests and webhook events
 */
class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private webhookCallbacks: Map<WebhookEvent, Function[]> = new Map();

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.initializeWebhookEvents();
  }

  /**
   * Initialize all webhook event listeners
   */
  private initializeWebhookEvents() {
    const events: WebhookEvent[] = [
      'user.registered', 'user.logged_in', 'listing.created', 
      'listing.updated', 'listing.deleted', 'otp.requested',
      'otp.verified', 'favorite.added', 'favorite.removed', 'contact.requested',
      'user.updated', 'user.deleted'
    ];
    
    events.forEach(event => {
      this.webhookCallbacks.set(event, []);
    });
  }

  /**
   * Register a callback for webhook events
   */
  on(event: WebhookEvent, callback: (data: any) => void) {
    const callbacks = this.webhookCallbacks.get(event) || [];
    callbacks.push(callback);
    this.webhookCallbacks.set(event, callbacks);
  }

  /**
   * Remove a webhook callback
   */
  off(event: WebhookEvent, callback: (data: any) => void) {
    const callbacks = this.webhookCallbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Trigger webhook event to all registered callbacks
   */
  private triggerWebhook(event: WebhookEvent, data: any) {
    const callbacks = this.webhookCallbacks.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Webhook callback error for ${event}:`, error);
      }
    });
  }

  /**
   * Core request method with error handling and logging
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Handle request body - FIXED: Properly handle body serialization
    if (options.body && typeof options.body === 'object' && !this.isBodyInit(options.body)) {
      config.body = JSON.stringify(options.body);
    } else {
      config.body = options.body;
    }

    try {
      console.log(`🔄 API Call: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${config.method || 'GET'} ${url}`);
      return data;
      
    } catch (error) {
      console.error(`❌ API Error (${config.method || 'GET'} ${url}):`, error);
      throw error;
    }
  }

  /**
   * Check if value is a valid BodyInit type
   */
  private isBodyInit(value: any): value is BodyInit {
    return (
      typeof value === 'string' ||
      value instanceof Blob ||
      value instanceof ArrayBuffer ||
      value instanceof FormData ||
      value instanceof URLSearchParams ||
      (ArrayBuffer.isView(value) && !(value instanceof DataView))
    );
  }

  // =============================================
  // HEALTH & SYSTEM ENDPOINTS
  // =============================================

  /**
   * Get system health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /**
   * Test all API connections
   */
  async testAllConnections(): Promise<TestConnectionResults> {
    const results: TestConnectionResults = {
      health: null,
      users: null,
      error: null
    };

    try {
      console.group('🧪 Testing API Connections');
      
      // Test health endpoint
      results.health = await this.getHealth();
      console.log('✅ Health check passed');
      
      // Test users endpoint
      const usersData = await this.getUsers();
      results.users = usersData.users || usersData;
      console.log('✅ Users endpoint check passed');
      
      console.groupEnd();
      return results;
      
    } catch (error: any) {
      results.error = error.message;
      console.error('❌ API Test failed:', error);
      console.groupEnd();
      return results;
    }
  }

  /**
   * Quick health check for component mounting
   */
  async quickHealthCheck(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  // =============================================
  // AUTH ENDPOINTS - FIXED: Proper body handling
  // =============================================

  async register(userData: any) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('user.registered', result);
    return result;
  }

  async requestOtp(email: string) {
    const result = await this.request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('otp.requested', { email });
    return result;
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }) // ✅ Fixed: Explicit stringify
    });
    
    if (result.success) {
      this.triggerWebhook('otp.verified', { email });
      this.triggerWebhook('user.logged_in', { email, user: result.user });
    }
    
    return result;
  }

  // =============================================
  // USER MANAGEMENT ENDPOINTS - FIXED
  // =============================================

  async getUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>('/users');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData) // ✅ Fixed: Explicit stringify
    });
  }

  async updateUser(id: string, userData: any) {
    const result = await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('user.updated', { userId: id, ...userData });
    return result;
  }

  async deleteUser(id: string) {
    const result = await this.request(`/users/${id}`, {
      method: 'DELETE'
    });
    
    this.triggerWebhook('user.deleted', { userId: id });
    return result;
  }

  async getUserListings(userId: string) {
    return this.request(`/users/${userId}/listings`);
  }

  // =============================================
  // LISTING MANAGEMENT ENDPOINTS - FIXED
  // =============================================

  async getListings() {
    return this.request('/listings');
  }

  async getListing(id: string) {
    return this.request(`/listings/${id}`);
  }

  async createListing(listingData: any) {
    const result = await this.request('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('listing.created', result);
    return result;
  }

  async updateListing(id: string, listingData: any) {
    const result = await this.request(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(listingData) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('listing.updated', { listingId: id, ...listingData });
    return result;
  }

  async deleteListing(id: string) {
    const result = await this.request(`/listings/${id}`, {
      method: 'DELETE'
    });
    
    this.triggerWebhook('listing.deleted', { listingId: id });
    return result;
  }

  async getListingsByCity(city: string) {
    return this.request(`/listings/city/${city}`);
  }

  async getListingsByPriceRange(min: number, max: number) {
    return this.request(`/listings/price/${min}/${max}`);
  }

  // =============================================
  // FAVORITE & CONTACT MANAGEMENT
  // =============================================

  async addFavorite(listingId: string, userId: string) {
    // Simulate favorite API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { success: true, listingId, userId };
    
    this.triggerWebhook('favorite.added', result);
    return result;
  }

  async removeFavorite(listingId: string, userId: string) {
    // Simulate favorite removal API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { success: true, listingId, userId };
    
    this.triggerWebhook('favorite.removed', result);
    return result;
  }

  async sendContactRequest(listingId: string, message: string, userData: any) {
    // Simulate contact request API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = { success: true, listingId, message, userData };
    
    this.triggerWebhook('contact.requested', result);
    return result;
  }
}

export const apiService = new ApiService();
export default apiService;