// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Custom options can be added here if needed later
}

export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!API_BASE_URL) {
    const errorMessage = "API_BASE_URL is not defined. Please set NEXT_PUBLIC_API_URL in your .env.local or hosting provider's environment settings.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const cleanApiBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${cleanApiBaseUrl}/${cleanEndpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };
  
  // console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  // if (config.body && typeof config.body === 'string' && config.body.length < 500) {
  //    console.log('With body:', config.body); 
  // }


  try {
    const response = await fetch(url, config);
    const responseText = await response.text();
    
    // console.log(`Raw response text from ${url} (status ${response.status}):`, responseText.substring(0, 500));

    if (!response.ok) {
      let errorResponseMessage = `API Error: ${response.status} ${response.statusText || 'Status Code ' + response.status }`;
      let errorDetails: any = { responseBody: responseText, status: response.status, parsedSpecificMessage: null };
      
      try {
        if (responseText && responseText.trim().startsWith('{')) { // More robust check for JSON
          const parsedError = JSON.parse(responseText);
          if (parsedError && typeof parsedError.message === 'string' && parsedError.message.trim() !== '') {
            errorResponseMessage = parsedError.message; // Use specific message from API
            errorDetails.parsedError = parsedError;
            errorDetails.parsedSpecificMessage = parsedError.message;
          } else if (parsedError && typeof parsedError.error === 'string' && parsedError.error.trim() !== '') {
            errorResponseMessage = parsedError.error; // Fallback to error field
            errorDetails.parsedError = parsedError;
            errorDetails.parsedSpecificMessage = parsedError.error;
          }
           else {
            console.warn("Parsed JSON error response did not contain a valid 'message' or 'error' field. Response:", parsedError);
          }
        } else if (responseText.trim() !== '') {
            console.warn(`Non-JSON error response received from API for ${url} (Status: ${response.status}). Body:`, responseText.substring(0,200));
        } else {
            console.warn(`Empty error response received from API for ${url} (Status: ${response.status})`);
        }
      } catch (e) {
        console.warn(`Could not parse non-OK API response as JSON from ${url}. Status: ${response.status}. Error:`, e, "Response Text:", responseText.substring(0,200));
      }
      
      console.error(`API call to ${url} failed. Status: ${response.status}. Final Error Message: "${errorResponseMessage}". Raw Response (first 200 chars): "${responseText.substring(0, 200)}..."`, "Full Details:", errorDetails);
      
      const error = new Error(errorResponseMessage) as any; 
      error.status = response.status;
      error.responseBody = responseText; 
      error.details = errorDetails;
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
        if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
            return { success: true, message: `Operation successful with status ${response.status}, no content.` };
        }
        throw new Error(`Received successful HTTP status (${response.status}), but response was not valid JSON and not empty.`);
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      // console.log(`API call to ${url} successful with empty response (status ${response.status}).`);
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    // console.log(`API call to ${url} returned non-JSON text:`, responseText.substring(0,500));
    return { success: true, data: responseText };

  } catch (error: any) {
    // This catches network errors or errors thrown from the !response.ok block.
    console.error(`Error during API call to ${url}:`, error.message);
    if (!(error instanceof Error)) { // Ensure it's always an Error object being thrown
        const newError = new Error(String(error.message || error || "Unknown fetch error"));
        (newError as any).status = error.status; // Preserve status if it was set
        (newError as any).responseBody = error.responseBody;
        (newError as any).details = error.details;
        throw newError;
    }
    throw error;
  }
}
