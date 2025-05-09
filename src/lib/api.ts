// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Custom options can be added here if needed later
}

export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  // Ensure NEXT_PUBLIC_API_URL is used from .env.local or environment variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_BASE_URL) {
    const errorMessage = "API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL in your .env.local file or hosting provider's environment settings.";
    console.error(errorMessage);
    // Return a rejected promise or throw to ensure calling code handles this
    return Promise.reject(new Error(errorMessage));
  }

  // Normalize URL construction
  const cleanApiBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${cleanApiBaseUrl}/${cleanEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json', // Often good to include
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Essential for sending/receiving session cookies
  };
  
  console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  if (config.body && typeof config.body === 'string' && config.body.length < 500) {
     // console.log('With body:', config.body); // Keep this commented or use for specific debugging
  }


  try {
    const response = await fetch(url, config);
    const responseText = await response.text();
    
    // console.log(`Raw response text from ${url} (status ${response.status}):`, responseText); // Debugging raw response

    if (!response.ok) {
      let errorResponseMessage = `API Error: ${response.status} ${response.statusText}`;
      let errorDetails: any = { responseBody: responseText, status: response.status };
      try {
        if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
          const parsedError = JSON.parse(responseText);
          if (parsedError && (parsedError.message || parsedError.error)) {
            errorResponseMessage = parsedError.message || parsedError.error;
            errorDetails.parsedError = parsedError;
          }
        }
      } catch (e) {
        console.warn("Could not parse non-OK API response as JSON:", e);
        // errorResponseMessage will remain the default HTTP status message
      }
      console.error(`API call to ${url} failed with status ${response.status}:`, errorResponseMessage, "Details:", errorDetails);
      const error = new Error(errorResponseMessage) as any; // Cast to any to add properties
      error.status = response.status;
      error.responseBody = responseText; 
      error.details = errorDetails;
      throw error;
    }

    // Handle successful responses
    if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
      try {
        const jsonData = JSON.parse(responseText);
        // console.log(`API JSON response from ${url}:`, jsonData); // Debugging successful JSON response
        return jsonData;
      } catch (e: any) {
        console.error(`Failed to parse successful response as JSON from ${url}:`, e.message, "Response text:", responseText);
        // If responseText is empty but status is 2xx, it might be an intentional empty success (e.g., 204 No Content)
        if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
            return { success: true, message: `Operation successful with status ${response.status}, no content.` };
        }
        // If parsing fails for non-empty text, it's an issue.
        throw new Error(`Received successful HTTP status (${response.status}), but response was not valid JSON and not empty.`);
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    // Fallback for successful non-JSON, non-empty responses (less common for APIs)
    // console.log(`API call to ${url} returned non-JSON text:`, responseText);
    return { success: true, data: responseText }; // Or handle as an error if JSON is always expected

  } catch (error: any) {
    // This catches network errors (e.g., DNS, no connection, CORS blocked by browser *before* response)
    // or errors thrown from the !response.ok block.
    console.error(`Error during API call to ${url}:`, error.message);
    // Ensure the error thrown here is an actual Error object
    if (error instanceof Error) {
        throw error;
    } else {
        // If it's not an Error object, wrap it or create a new one
        throw new Error(String(error.message || error || "Unknown fetch error"));
    }
  }
}