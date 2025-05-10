// src/lib/api.ts

interface FetchOptions extends RequestInit {
  // Custom options can be added here if needed later
}

export async function fetchFromApi(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  // This function is kept for potential future use or for non-auth related API calls
  // such as currency detection or fetching external data.
  // For now, if NEXT_PUBLIC_API_BASE_URL is not set, it will reject.

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // If you still have some external non-auth API

  if (!API_BASE_URL && !endpoint.startsWith('http')) {
    const errorMessage = "NEXT_PUBLIC_API_URL is not defined and endpoint is relative. Cannot make API call.";
    console.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL?.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // credentials: 'include', // Removed, as it was for PHP session cookies
  };
  
  console.log(`Calling API: ${config.method || 'GET'} ${url}`);
  if (config.body && typeof config.body === 'string' && config.body.length < 500) {
     console.log('With body:', config.body); 
  }

  try {
    const response = await fetch(url, config);
    const responseText = await response.text(); 
    
    console.log(`Raw response text from ${url} (status ${response.status}):`, responseText.substring(0, 200));

    if (!response.ok) {
      let errorResponseMessage = `API Error: ${response.status} ${response.statusText || 'Status Code ' + response.status }`;
      let errorDetails: any = { responseBody: responseText, status: response.status, parsedSpecificMessage: null };
      
      try {
        if (responseText && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
          const parsedError = JSON.parse(responseText);
          if (parsedError && typeof parsedError.message === 'string' && parsedError.message.trim() !== '') {
            errorResponseMessage = parsedError.message;
            errorDetails.parsedError = parsedError;
            errorDetails.parsedSpecificMessage = parsedError.message;
          } else if (parsedError && typeof parsedError.error === 'string' && parsedError.error.trim() !== '') {
            errorResponseMessage = parsedError.error;
            errorDetails.parsedError = parsedError;
            errorDetails.parsedSpecificMessage = parsedError.error;
          }
        }
      } catch (e) {
        // Silent catch if parsing fails
      }
      
      console.error(`API call to ${url} failed with status ${response.status}:`, errorResponseMessage, "Details:", errorDetails);
      
      const error = new Error(errorResponseMessage) as any;
      error.status = response.status;
      error.responseBody = responseText;
      error.details = errorDetails;
      throw error;
    }

    if (responseText && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log(`API JSON response from ${url}:`, jsonData);
        return jsonData;
      } catch (e: any) {
        console.error(`Failed to parse successful response as JSON from ${url}:`, e.message, "Response text:", responseText.substring(0,500));
        if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
            return { success: true, message: `Operation successful with status ${response.status}, no content.` };
        }
        throw new Error(`Received successful HTTP status (${response.status}), but response was not valid JSON and not empty.`);
      }
    } else if (responseText.trim() === '' && response.status >= 200 && response.status < 300) {
      return { success: true, message: `Operation successful with status ${response.status}, no content.` };
    }
    
    console.log(`API call to ${url} returned non-JSON text:`, responseText.substring(0,500));
    return { success: true, data: responseText };

  } catch (error: any) {
    console.error(`Error during API call to ${url}:`, error.message);
    if (error instanceof Error) {
        throw error;
    } else {
        const newError = new Error(String(error.message || error || "Unknown fetch error"));
        if(typeof error === 'object' && error !== null) {
            Object.assign(newError, error);
        }
        throw newError;
    }
  }
}
