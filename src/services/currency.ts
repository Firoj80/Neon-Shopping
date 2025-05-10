// src/services/currency.ts

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

const countryCurrencyMap: Record<string, string> = {
  US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', CA: 'CAD',
  AU: 'AUD', JP: 'JPY', CN: 'CNY', IN: 'INR', BR: 'BRL', RU: 'RUB', ZA: 'ZAR',
  MX: 'MXN', KR: 'KRW', SG: 'SGD', HK: 'HKD', NZ: 'NZD', CH: 'CHF', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY', AE: 'AED', SA: 'SAR', BD: 'BDT',
};

/**
 * Attempts to retrieve the user's likely currency based on geolocation or IP.
 * Returns null if detection fails or an error occurs.
 */
export async function getUserCurrency(): Promise<Currency | null> {
  console.log("Attempting to get user currency...");
  const supported = await getSupportedCurrencies(); // Get supported currencies once

  // 1. Try Browser Geolocation API (Requires HTTPS and User Permission)
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      console.log("Geolocation success:", position.coords);

      // --- SIMULATED REVERSE GEOCODING ---
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      let countryCode: string | undefined = undefined;
      if (lat > 23 && lat < 28 && lon > 88 && lon < 93) countryCode = 'BD';
      else if (lat > 24 && lat < 72 && lon < -52 && lon > -169) countryCode = 'US';
      else if (lat > 34 && lat < 71 && lon > -10 && lon < 40) countryCode = 'DE';
      else if (lat > 6 && lat < 38 && lon > 68 && lon < 98) countryCode = 'IN';
      // --- END SIMULATION ---
      console.log("Simulated country code from Geolocation:", countryCode);

      if (countryCode && countryCurrencyMap[countryCode]) {
        const currencyCode = countryCurrencyMap[countryCode];
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
    }
  } else {
    console.log("Geolocation API not available or not in a secure context.");
  }

  // 2. Fallback to IP-Based Geolocation
  try {
    console.log("Attempting IP-based geolocation via ipapi.co...");
    const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
     if (!response.ok) {
         throw new Error(`IP Geolocation request failed with status: ${response.status}`);
     }
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    console.log("IP Geolocation Response:", data);

    if (countryCode && countryCurrencyMap[countryCode]) {
      const currencyCode = countryCurrencyMap[countryCode];
      const foundCurrency = supported.find(c => c.code === currencyCode);
      if (foundCurrency) {
        console.log(`Currency detected via IP Geolocation: ${foundCurrency.code}`);
        return foundCurrency;
      }
    }
  } catch (error) {
    console.error("Error during IP-based geolocation:", error);
  }

  console.log("Currency detection failed, returning null (will use default).");
  return null;
}


export async function getSupportedCurrencies(): Promise<Currency[]> {
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
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  ].sort((a, b) => a.name.localeCompare(b.name));
}
