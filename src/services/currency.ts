
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

/**
 * Asynchronously retrieves the user's current currency based on their location.
 *
 * @returns A promise that resolves to a Currency object.
 */
export async function getUserCurrency(): Promise<Currency> {
  // TODO: Implement this by calling an API.
  return {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  };
}

/**
 * Asynchronously retrieves a list of supported currencies.
 * TODO: Replace this with a call to a real currency API or library for a comprehensive list.
 * @returns A promise that resolves to an array of Currency objects.
 */
export async function getSupportedCurrencies(): Promise<Currency[]> {
  // Sample list of world currencies
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
