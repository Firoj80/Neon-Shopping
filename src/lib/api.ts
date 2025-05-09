// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Custom options can be added here if needed later
}

export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_BASE_URL) {
    const errorMessage = "API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL in your environment variables (.env.local or hosting provider settings).";
    console.error(errorMessage);
    // For client-side errors, we might not be able to throw in a way that Next.js error overlay catches it
    // but we can return a promise that rejects, which should be caught by the calling code.
    return Promise.reject(new Error(errorMessage));
  }

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

  // Add a cache-busting parameter for GET requests to avoid overly aggressive caching
  // if (config.method === 'GET' || !config.method) {
  //   const cacheBust = `_cb=${new Date().getTime()}`;
  //   url = url.includes('?') ? `${url}&${cacheBust}` : `${url}?${cacheBust}`;
  // }


  console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  if (config.body && typeof config.body === 'string' && config.body.length < 500) { // Log small bodies
     // console.log('With body:', config.body); // Be cautious logging request bodies
  }


  try {
    const response = await fetch(url, config);

    // Try to get text first to see what the server actually sent, especially for errors
    const responseText = await response.text();
    // console.log(`API raw response text from ${url} (status ${response.status}):`, responseText);


    if (!response.ok) {
      let errorData = { message: `API Error: ${response.status} ${response.statusText}`, responseBody: responseText };
      try {
        // Attempt to parse error response as JSON if it looks like one
        if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
          const parsedError = JSON.parse(responseText);
          if (parsedError && (parsedError.message || parsedError.error)) {
            errorData.message = parsedError.message || parsedError.error;
          }
        }
      } catch (e) {
        console.warn("Could not parse non-OK API response as JSON from API:", e);
      }
      console.error(`API call to ${url} failed with status ${response.status}:`, errorData.message, "Full response:", responseText);
      // Throw an error object that includes the status and potentially the body for better handling
      const error = new Error(errorData.message) as any;
      error.status = response.status;
      error.responseBody = responseText; 
      throw error;
    }

    // If response.ok, then try to parse as JSON
    if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
      try {
        const jsonData = JSON.parse(responseText);
        // console.log(`API JSON response from ${url}:`, jsonData);
        return jsonData;
      } catch (e) {
        console.error(`Failed to parse successful response as JSON from ${url}:`, e, "Response text:", responseText);
        // If parsing fails but status was OK, it might be an issue with the server sending non-JSON for a 2xx.
        // Or it could be an empty successful response which is fine.
        if (responseText.trim() === '') {
            return { success: true, message: "Operation successful, no content." };
        }
        // If it's not empty and not JSON, this is unexpected for a successful response.
        throw new Error("Received successful HTTP status, but response was not valid JSON and not empty.");
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      // Handle empty successful responses (e.g., for DELETE or some POSTs)
      // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    // If it's not JSON and not an empty successful response, but still response.ok (e.g. plain text for some reason)
    // This case should be rare if your API consistently returns JSON.
    // console.log(`API call to ${url} returned non-JSON text:`, responseText);
    return { success: true, data: responseText };


  } catch (error: any) {
    // This catches network errors (e.g., DNS, no connection, CORS blocked by browser *before* response)
    // or errors thrown from the !response.ok block.
    console.error(`Error during API call to ${url}:`, error.message);
    // Ensure the error thrown here is an actual Error object
    if (error instanceof Error) {
        throw error;
    } else {
        throw new Error(String(error)); // Convert to string if it's not an error object
    }
  }
}

    