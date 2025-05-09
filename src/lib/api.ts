// src/lib/api.ts
// IMPORTANT: Replace with your actual deployed API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api/php';

interface FetchOptions extends RequestInit {
  userId?: string | null; // Optional: Send userId for authenticated requests
}

/**
 * Fetches data from the PHP API.
 * @param endpoint The API endpoint (e.g., 'auth/login.php')
 * @param options Fetch options, including method, body, headers.
 * @param includeCredentials If true, sends credentials (cookies) with the request.
 */
export async function fetchFromApi(endpoint: string, options: FetchOptions = {}, includeCredentials = true) {
  const headers = new Headers(options.headers || {});
  headers.append('Content-Type', 'application/json');

  // If userId is provided in options, add it as a header or part of the body/query
  // For PHP sessions, cookies are often handled automatically by the browser if on the same domain/subdomain.
  // If sending userId explicitly (e.g., for initial data load before session is fully established):
  if (options.userId && options.method === 'GET') {
    // Append to URL for GET requests
    const separator = endpoint.includes('?') ? '&' : '?';
    endpoint = `${endpoint}${separator}user_id=${encodeURIComponent(options.userId)}`;
  } else if (options.userId && options.body && typeof options.body === 'string') {
    // Add to body for POST/PUT if body is JSON string
    try {
      const bodyData = JSON.parse(options.body);
      bodyData.user_id = options.userId;
      options.body = JSON.stringify(bodyData);
    } catch (e) {
      console.warn("Could not automatically add user_id to non-JSON body for API request.");
    }
  }


  const fetchConfig: RequestInit = {
    ...options,
    headers,
  };

  if (includeCredentials) {
    fetchConfig.credentials = 'include'; // Important for sending/receiving session cookies
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, fetchConfig);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || 'API request failed and could not parse error response.' };
    }
    console.error(`API Error (${endpoint}): ${response.status}`, errorData);
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }

  // Handle cases where the response might be empty (e.g., successful logout)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  } else {
    return response.text().then(text => text ? { success: true, message: text } : { success: true });
  }
}
