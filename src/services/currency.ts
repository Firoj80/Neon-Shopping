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
 *
 * @returns A promise that resolves to an array of Currency objects.
 */
export async function getSupportedCurrencies(): Promise<Currency[]> {
  // TODO: Implement this by calling an API to fetch a list of currencies.

  return [
    {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
    },
    {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
    },
    {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
    },
  ];
}
