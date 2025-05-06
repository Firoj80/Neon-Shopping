/**
 * Represents currency information.
 */
export interface Currency {
  /**
   * The currency code (e.g., USD, EUR, JPY).
   */
  code: string;
  /**
   * The currency symbol (e.g., $, €, ¥).
   */
  symbol: string;
  /**
   * The currency name (e.g. US Dollar, Euro, Japanese Yen)
   */
  name: string;
}

// Mapping from country codes (ISO 3166-1 alpha-2) to currency codes
// This is a simplified list, a more comprehensive library might be needed for full coverage
const countryCurrencyMap: Record<string, string> = {
  US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', CA: 'CAD',
  AU: 'AUD', JP: 'JPY', CN: 'CNY', IN: 'INR', BR: 'BRL', RU: 'RUB', ZA: 'ZAR',
  MX: 'MXN', KR: 'KRW', SG: 'SGD', HK: 'HKD', NZ: 'NZD', CH: 'CHF', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY', AE: 'AED', SA: 'SAR', // ... add more as needed
};

/**
 * Attempts to retrieve the user's likely currency based on geolocation.
 * Uses the browser's Geolocation API and falls back to IP-based lookup if needed.
 * Requires user permission for location access.
 *
 * @returns A promise that resolves to the detected Currency object or null if detection fails or permission is denied.
 */
export async function getUserCurrency(): Promise<Currency | null> {
  // 1. Try Browser Geolocation API (Requires HTTPS and User Permission)
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000 // 5-second timeout
        });
      });

      // Use latitude/longitude to get country code (requires a reverse geocoding service)
      // Example using a free API (like OpenCage Geocoding - requires API key)
      // NOTE: Replace with your preferred reverse geocoding service and API key handling
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      // IMPORTANT: You'll need to replace this fetch with a real reverse geocoding API call.
      // For demonstration, we'll simulate a response.
      // const response = await fetch(`https://api.example-geocoding.com/reverse?lat=${lat}&lon=${lon}&key=YOUR_API_KEY`);
      // const data = await response.json();
      // const countryCode = data.results[0]?.components?.country_code?.toUpperCase();

      // --- SIMULATED RESPONSE ---
      // Replace this simulation with actual API call logic
      let countryCode: string | undefined = undefined;
      // Simulate detection based on general location (e.g., North America -> USD)
      if (lat > 24 && lat < 72 && lon < -52 && lon > -169) countryCode = 'US';
      else if (lat > 34 && lat < 71 && lon > -10 && lon < 40) countryCode = 'DE'; // Simulate Europe -> EUR
      else if (lat > 20 && lat < 50 && lon > 60 && lon < 150) countryCode = 'IN'; // Simulate Asia -> INR
       // Add more simulation logic if needed for testing
      console.log("Simulated country code from Geolocation:", countryCode);
      // --- END SIMULATION ---


      if (countryCode && countryCurrencyMap[countryCode]) {
        const currencyCode = countryCurrencyMap[countryCode];
        const supported = await getSupportedCurrencies();
        const foundCurrency = supported.find(c => c.code === currencyCode);
        if (foundCurrency) {
          console.log(`Currency detected via Geolocation: ${foundCurrency.code}`);
          return foundCurrency;
        }
      }
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        console.warn("Geolocation permission denied by user.");
      } else {
        console.warn("Error getting geolocation:", error.message);
      }
      // Proceed to IP-based lookup if geolocation fails or is denied
    }
  } else {
    console.log("Geolocation API not available.");
    // Proceed to IP-based lookup
  }

  // 2. Fallback to IP-Based Geolocation (Requires a Server-Side Endpoint or Third-Party Service)
  // This part usually involves making a request to a service that maps IP addresses to locations.
  // Since this is client-side, we can only call external services.
  // Example using ip-api.com (Free for non-commercial use, check terms)
  try {
    console.log("Attempting IP-based geolocation...");
    const response = await fetch('https://ipapi.co/json/'); // Simple IP lookup
     if (!response.ok) {
         throw new Error(`IP Geolocation request failed with status: ${response.status}`);
     }
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
     console.log("IP Geolocation Response:", data); // Log the response for debugging

    if (countryCode && countryCurrencyMap[countryCode]) {
      const currencyCode = countryCurrencyMap[countryCode];
      const supported = await getSupportedCurrencies();
      const foundCurrency = supported.find(c => c.code === currencyCode);
      if (foundCurrency) {
        console.log(`Currency detected via IP Geolocation: ${foundCurrency.code}`);
        return foundCurrency;
      }
    } else {
         console.log("Could not determine currency from IP Geolocation data:", data);
    }
  } catch (error) {
    console.error("Error during IP-based geolocation:", error);
  }

  // 3. Return null if detection fails
  console.log("Currency detection failed, returning null.");
  return null;
}

/**
 * Asynchronously retrieves a list of supported currencies.
 * @returns A promise that resolves to an array of Currency objects.
 */
export async function getSupportedCurrencies(): Promise<Currency[]> {
  // Keep the comprehensive list from previous step
  return [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
    { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'COP', symbol: 'COL$', name: 'Colombian Peso' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
     // Add more currencies as needed...
  ].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
}
