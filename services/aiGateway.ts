import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI GATEWAY - Single Entry Point for Gemini SDK
 * 
 * ARCHITECTURE RULE:
 * - This is the ONLY file that can instantiate GoogleGenerativeAI
 * - All other services MUST use this gateway
 * - No UI component can import @google/generative-ai directly
 */

// Singleton instance
let geminiClient: GoogleGenerativeAI | null = null;
let currentApiKey: string = '';

export const aiGateway = {
  /**
   * Get or create Gemini client
   * This is the ONLY function that creates GoogleGenerativeAI instances
   */
  getClient(apiKey: string): GoogleGenerativeAI {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('[AIGateway] API Key is required');
    }
    
    // Reuse existing client if API key hasn't changed
    if (currentApiKey === apiKey && geminiClient) {
      return geminiClient;
    }
    
    // Create new client
    console.log('[AIGateway] Initializing new Gemini client');
    geminiClient = new GoogleGenerativeAI(apiKey);
    currentApiKey = apiKey;
    
    return geminiClient;
  },
  
  /**
   * Invalidate client (call when API key changes or is removed)
   */
  invalidate(): void {
    console.log('[AIGateway] Invalidating Gemini client');
    geminiClient = null;
    currentApiKey = '';
  },
  
  /**
   * Check if a client is currently initialized
   */
  isInitialized(): boolean {
    return geminiClient !== null && currentApiKey !== '';
  }
};
