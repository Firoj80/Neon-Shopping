/**
 * @fileOverview Centralized Genkit AI instance.
 * This file defines and exports the global `ai` object used for all Genkit operations.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai'; // Ensure you have @genkit-ai/googleai installed

// Define and configure the Genkit instance
// Ensure GOOGLE_GENAI_API_KEY is set in your environment variables
// For local development, you can use a .env file (ensure it's in .gitignore)
// For deployment, set it in your hosting provider's environment settings.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // You can specify other Google AI plugin options here if needed
    }),
  ],
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info', // More logs in dev
  // flowStateStore: 'firebase', // Example if using Firebase for flow state storage
  // traceStore: 'firebase',     // Example if using Firebase for trace storage
});
