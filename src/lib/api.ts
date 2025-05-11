// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Custom options can be added here if needed later
}

export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  // Consistently use NEXT_PUBLIC_API_BASE_URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!API_BASE_URL) {
    // Update error message to match the variable name
    const errorMessage = "NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in your .env file (e.g., .env.local) or hosting provider's environment settings.";
    console.error(errorMessage);
    // Ensure a Promise rejection with an Error object
    return Promise.reject(new Error(errorMessage));
  }

  // Ensure the base URL and endpoint are combined correctly
  const cleanApiBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${cleanApiBaseUrl}/${cleanEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // Add any other default headers your API might expect
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Crucial for sending cookies with requests to your PHP backend
    credentials: 'include', 
  };
  
  // Debugging logs (optional, remove for production)
  // console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  // if (config.body && typeof config.body === 'string' && config.body.length < 500) {
  //    console.log('With body:', config.body); 
  // }


  try {
    const response = await fetch(url, config);
    const responseText = await response.text(); // Get text first for better error inspection
    
    // Optional: Log raw response for debugging
    // console.log(`Raw response text from ${url} (status ${response.status}):`, responseText.substring(0, 500));

    if (!response.ok) {
      let errorResponseMessage = `API Error: ${response.status} ${response.statusText || 'Status Code ' + response.status }`;
      let errorDetails: any = { responseBody: responseText, status: response.status, parsedSpecificMessage: null };
      
      // Try to parse JSON error from response body
      try {
        if (responseText && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
          const parsedError = JSON.parse(responseText);
          if (parsedError && typeof parsedError.message === 'string' && parsedError.message.trim() !== '') {
            errorResponseMessage = parsedError.message; // Use specific message from API
            errorDetails.parsedError = parsedError; // Keep the full parsed error
            errorDetails.parsedSpecificMessage = parsedError.message;
          } else if (parsedError && typeof parsedError.error === 'string' && parsedError.error.trim() !== '') {
            errorResponseMessage = parsedError.error; // Fallback to 'error' field if 'message' is not present
            errorDetails.parsedError = parsedError;
            errorDetails.parsedSpecificMessage = parsedError.error;
          }
           else {
            // console.warn("Parsed JSON error response did not contain a valid 'message' or 'error' field. Response:", parsedError);
          }
        } else if (responseText.trim() !== '') {
            // console.warn(`Non-JSON error response received from API for ${url} (Status: ${response.status}). Body:`, responseText.substring(0,200));
        } else {
            // console.warn(`Empty error response received from API for ${url} (Status: ${response.status})`);
        }
      } catch (e) {
        // console.warn(`Could not parse non-OK API response as JSON from ${url}. Status: ${response.status}. Error:`, e, "Response Text:", responseText.substring(0,200));
      }
      
      console.error(`API call to ${url} failed with status ${response.status}:`, errorResponseMessage, "Details:", errorDetails);
      
      const error = new Error(errorResponseMessage) as any; // Cast to any to add properties
      error.status = response.status;
      error.responseBody = responseText; // Attach raw body for more context
      error.details = errorDetails; // Attach parsed details if any
      throw error;
    }

    // Handle successful responses
    if (responseText && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
      try {
        const jsonData = JSON.parse(responseText);
        // console.log(`API JSON response from ${url}:`, jsonData);
        return jsonData;
      } catch (e: any) {
        console.error(`Failed to parse successful response as JSON from ${url}:`, e.message, "Response text:", responseText.substring(0,500));
        // If it's a 2xx status but empty or non-JSON, treat as success with no data or specific message
        if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
            // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
            return { success: true, message: `Operation successful with status ${response.status}, no content.` };
        }
        // If it's not empty but still fails to parse, it's an issue
        throw new Error(`Received successful HTTP status (${response.status}), but response was not valid JSON and not empty.`);
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      // Handle successful but empty responses (e.g., 204 No Content)
      // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    // Handle successful responses that are plain text (if expected)
    // console.log(`API call to ${url} returned non-JSON text:`, responseText.substring(0,500));
    return { success: true, data: responseText }; // Or handle as an error if JSON was always expected

  } catch (error: any) {
    // This catches network errors (e.g., DNS, no connection, CORS blocked by browser *before* response)
    // or errors thrown from the !response.ok block.
    console.error(`Error during API call to ${url}:`, error.message);
    // Re-throw the error or return a structured error object
    // Ensuring the status code is passed along if available
    if (error instanceof Error) { // Check if it's already an Error instance
        throw error;
    } else { // If not, wrap it in an Error object
        const newError = new Error(String(error.message || error || "Unknown fetch error"));
        // Attempt to preserve any custom properties from the original error if it was an object
        if(typeof error === 'object' && error !== null) {
            Object.assign(newError, error);
        }
        throw newError;
    }
  }
}
