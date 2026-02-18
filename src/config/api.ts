/**
 * API Configuration
 *
 * Centralized configuration for all external API endpoints.
 * Uses Vite environment variables (VITE_*) for security.
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Set actual API URLs in your .env file
 * 3. Never commit .env to version control
 */

export const API_CONFIG = {
  /** URL for support/contact form submissions */
  SUPPORT_URL: import.meta.env.VITE_API_SUPPORT_URL || '',

  /** URL for order email notifications */
  ORDER_URL: import.meta.env.VITE_API_ORDER_URL || '',

  /** URL for password reset requests */
  PASSWORD_RESET_URL: import.meta.env.VITE_API_PASSWORD_RESET_URL || '',
} as const;

// Type for API config keys
export type ApiConfigKey = keyof typeof API_CONFIG;

// Validate configuration at runtime in development
if (import.meta.env.DEV) {
  const missing = Object.entries(API_CONFIG)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      '[API Config] Missing environment variables:',
      missing.map(k => `VITE_API_${k.replace('_URL', '')}_URL`).join(', '),
      '\nSee .env.example for required variables.'
    );
  }
}
