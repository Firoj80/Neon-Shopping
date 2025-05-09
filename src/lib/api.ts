// src/lib/api.ts

/**
 * Represents options for the fetchFromApi function.
 * Extends the standard RequestInit interface.
 */
interface FetchOptions extends RequestInit {
  // Add any custom options specific to your API calls if needed
}

/**
 * A utility function to make API calls to the PHP backend.
 *
 * @param endpoint - The API endpoint to call (e.g., 'auth/login.php').
 * @param options - Optional fetch options (method, body, headers, etc.).
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error if the API call fails or returns a non-OK status.
 */
export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_BASE_URL) {
    console.error("API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL in your environment variables.");
    throw new Error("API base URL is not configured.");
  }

  // Ensure API_BASE_URL does not end with a slash & endpoint does not start with one for clean join
  const cleanApiBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${cleanApiBaseUrl}/${cleanEndpoint}`;


  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // If you implement token-based authentication later, you would add the Authorization header here:
    // 'Authorization': `Bearer ${your_auth_token}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', 
  };

  try {
    console.log(`Calling API: ${config.method || 'GET'} ${url}`);
    if (config.body && typeof config.body === 'string') { // Check if body is string before logging potentially large objects
        // console.log('With body:', config.body); // Be cautious logging request bodies in production
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && (errorData.message || errorData.error)) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
        console.warn("Could not parse error response as JSON from API.");
      }
      console.error(`API call to ${url} failed with status ${response.status}:`, errorMessage);
      // Throw an error object that includes the status for better handling
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      // console.log(`API JSON response from ${url}:`, responseData);
      return responseData;
    }
    
    const textResponse = await response.text();
    // console.log(`API text response from ${url}:`, textResponse);
    try {
        return JSON.parse(textResponse);
    } catch (e) {
        // This means the response was successful (2xx) but not valid JSON.
        // It might be an empty response for a successful POST/DELETE, or just plain text.
        // For now, we'll return an object indicating success.
        // You might want to handle this differently based on specific endpoint expectations.
        if (response.status >= 200 && response.status < 300 && textResponse.trim() === '') {
            return { success: true, message: "Operation successful, no content." };
        }
        return { success: true, data: textResponse || "Operation successful, text response." };
    }

  } catch (error: any) {
    // Log network errors or errors from the !response.ok block
    console.error(`Error during API call to ${url}:`, error.message);
    // Re-throw the error or return a structured error object
    // Ensuring the status code is passed along if available
    throw error; 
  }
}
