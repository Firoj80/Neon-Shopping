
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
  
  console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  if (config.body && typeof config.body === 'string' && config.body.length < 500) {
     // console.log('With body:', config.body); 
  }


  try {
    const response = await fetch(url, config);
    const responseText = await response.text();
    
    // console.log(`Raw response text from ${url} (status ${response.status}):`, responseText);

    if (!response.ok) {
      let errorData = { message: `API Error: ${response.status} ${response.statusText}`, responseBody: responseText, status: response.status };
      try {
        if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
          const parsedError = JSON.parse(responseText);
          if (parsedError && (parsedError.message || parsedError.error)) {
            errorData.message = parsedError.message || parsedError.error;
          }
        }
      } catch (e) {
        console.warn("Could not parse non-OK API response as JSON:", e);
      }
      console.error(`API call to ${url} failed with status ${response.status}:`, errorData.message, "Full response text:", responseText);
      const error = new Error(errorData.message) as any;
      error.status = response.status;
      error.responseBody = responseText; 
      throw error;
    }

    if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
      try {
        const jsonData = JSON.parse(responseText);
        // console.log(`API JSON response from ${url}:`, jsonData);
        return jsonData;
      } catch (e) {
        console.error(`Failed to parse successful response as JSON from ${url}:`, e, "Response text:", responseText);
        if (responseText.trim() === '') {
            return { success: true, message: "Operation successful, no content." };
        }
        throw new Error("Received successful HTTP status, but response was not valid JSON and not empty.");
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    // console.log(`API call to ${url} returned non-JSON text:`, responseText);
    return { success: true, data: responseText };

  } catch (error: any) {
    // Log network errors or errors from the !response.ok block
    console.error(`Error during API call to ${url}:`, error); // Log the full error object
    // Re-throw the error or return a structured error object
    // Ensuring the status code is passed along if available
    throw error; 
  }
}

    