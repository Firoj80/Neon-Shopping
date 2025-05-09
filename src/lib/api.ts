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
  // Ensure your PHP API base URL is correctly set in environment variables or hardcoded if necessary.
  // For development, this might be http://localhost/path/to/your/api
  // For production, it will be your Hostinger domain + path to api, e.g., https://yourdomain.com/api
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/neon/api'; // Default if NEXT_PUBLIC_API_URL is not set

  // Construct the full URL, ensuring no double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  const url = `${API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/'}${cleanEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // If you implement token-based authentication later, you would add the Authorization header here:
    // 'Authorization': `Bearer ${your_auth_token}`,
  };

  // Merge default headers with any custom headers provided in options
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Important for PHP sessions: ensure cookies are sent with requests
    credentials: 'include', // This tells the browser to send cookies (like PHPSESSID)
  };

  try {
    console.log(`Calling API: ${config.method || 'GET'} ${url}`);
    if (config.body) {
        console.log('With body:', config.body);
    }

    const response = await fetch(url, config);

    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        // Attempt to parse error message from backend if available (assuming JSON error response)
        const errorData = await response.json();
        if (errorData && (errorData.message || errorData.error)) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
        // Could not parse JSON, use the default HTTP error message
        console.warn("Could not parse error response as JSON from API.");
      }
      console.error(`API call to ${url} failed:`, errorMessage);
      throw new Error(errorMessage);
    }

    // Handle cases where the response might be empty (e.g., for DELETE requests or successful POST with no content)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      console.log(`API response from ${url}:`, responseData);
      return responseData;
    }
    
    // If not JSON or empty, return the response text or null (or handle as needed)
    // For many PHP APIs, even a successful action might return a simple text confirmation.
    // If your PHP API always returns JSON, this part might be simplified.
    const textResponse = await response.text();
    console.log(`API text response from ${url}:`, textResponse);
    try {
        // Attempt to parse as JSON if it wasn't caught by content-type,
        // as some PHP setups might not set content-type correctly but still return JSON.
        return JSON.parse(textResponse);
    } catch (e) {
        // If it's not JSON, return the text or an object indicating success
        // This indicates a successful HTTP request but no JSON body to parse
        return { success: true, data: textResponse || "Operation successful, no content returned." };
    }

  } catch (error: any) {
    console.error(`Network or other error during API call to ${endpoint}:`, error.message);
    // Re-throw the error so it can be caught by the calling function
    // Or return a structured error object that your components can handle
    throw error; // Or: return { success: false, message: error.message || 'Network error' };
  }
}
