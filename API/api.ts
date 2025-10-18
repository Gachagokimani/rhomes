// services/apiService.ts
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

interface OTPResponse {
  success: boolean;
  message: string;
  resendAllowed?: boolean;
  cooldown?: number;
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
    
    // Create a clean config object
    const config: RequestInit = {
      method: options.method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      // Don't include body here, we'll handle it separately
    };

    // Handle request body serialization properly
    if (options.body) {
      if (typeof options.body === 'string' || 
          options.body instanceof FormData || 
          options.body instanceof URLSearchParams ||
          options.body instanceof Blob) {
        config.body = options.body;
      } else {
        // For objects, stringify them
        config.body = JSON.stringify(options.body);
      }
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
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${config.method || 'GET'} ${url}`);
      return data;
      
    } catch (error) {
      console.error(`❌ API Error (${config.method || 'GET'} ${url}):`, error);
      throw error;
    }
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
  // OTP AUTH ENDPOINTS - FIXED
  // =============================================

  /**
   * Send OTP to user email for verification
   */
  async sendOTP(email: string, purpose: string = 'account_verification'): Promise<OTPResponse> {
    const result = await this.request<OTPResponse>('/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('otp.requested', { email, purpose });
    return result;
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, otp: string, purpose: string = 'account_verification'): Promise<OTPResponse> {
    const result = await this.request<OTPResponse>('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, purpose }) // ✅ Fixed: Explicit stringify
    });
    
    if (result.success) {
      this.triggerWebhook('otp.verified', { email, purpose });
    }
    
    return result;
  }

  /**
   * Complete user registration after OTP verification
   */
  async register(userData: {
    name: string;
    email: string;
    role: string;
    password: string;
    bio?: string;
    phone: string;
  }): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(userData) // ✅ Fixed: Explicit stringify
    });
    
    if (result.success) {
      this.triggerWebhook('user.registered', result.user);
    }
    
    return result;
  }

  /**
   * Resend OTP code
   */
  async resendOTP(email: string, purpose: string = 'account_verification'): Promise<OTPResponse> {
    const result = await this.request<OTPResponse>('/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }) // ✅ Fixed: Explicit stringify
    });
    
    this.triggerWebhook('otp.requested', { email, purpose });
    return result;
  }

  // =============================================
  // LEGACY AUTH ENDPOINTS (for backward compatibility)
  // =============================================

  async requestOtp(email: string): Promise<OTPResponse> {
    return this.sendOTP(email);
  }

  async verifyOtp(email: string, otp: string): Promise<OTPResponse> {
    return this.verifyOTP(email, otp);
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

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Complete OTP registration flow (send OTP -> verify OTP -> register)
   */
  async completeOTPRegistration(
    email: string, 
    userData: any, 
    otp: string
  ): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Step 1: Verify OTP
      const verifyResult = await this.verifyOTP(email, otp, 'account_verification');
      if (!verifyResult.success) {
        return { success: false, message: verifyResult.message };
      }

      // Step 2: Complete registration
      const registerResult = await this.register(userData);
      return registerResult;

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate OTP format (6 digits)
   */
  validateOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

export const apiService = new ApiService();
export default apiService;