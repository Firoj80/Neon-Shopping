'use server';
/**
 * @fileOverview An AI agent for suggesting shopping item categories.
 *
 * - suggestCategory - A function that suggests a category for a given item name.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for the categories passed to the prompt
const CategorySchema = z.object({
  id: z.string().describe('The unique identifier of the category.'),
  name: z.string().describe('The display name of the category.'),
});

// Input schema for the flow and the prompt
const SuggestCategoryInputSchema = z.object({
  itemName: z.string().min(1).describe('The name of the shopping list item.'),
  availableCategories: z
    .array(CategorySchema)
    .min(1)
    .describe('An array of available categories to choose from.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

// Output schema for the flow and the prompt
const SuggestCategoryOutputSchema = z.object({
  suggestedCategoryId: z
    .string()
    .describe(
      'The ID of the suggested category. This ID must be one of the IDs from the availableCategories input. If no specific category is suitable, it may default to an "uncategorized" ID if provided, or an empty string if no suitable category is found.'
    ),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

/**
 * Suggests a category for a given shopping item name from a list of available categories.
 * @param input - The item name and the list of available categories.
 * @returns The ID of the suggested category.
 */
export async function suggestCategory(
  input: SuggestCategoryInput
): Promise<SuggestCategoryOutput> {
  // Ensure there's at least one category, and one of them is 'uncategorized' or a sensible default
  if (input.availableCategories.length === 0) {
    return { suggestedCategoryId: '' }; // Or handle as an error
  }
  const hasUncategorized = input.availableCategories.some(cat => cat.id.toLowerCase() === 'uncategorized' || cat.name.toLowerCase() === 'uncategorized');
  if (!hasUncategorized && !input.availableCategories.find(cat => cat.id === '')) {
    // Add a fallback if 'uncategorized' isn't present to ensure the LLM has a default
    // This part might be better handled by ensuring 'uncategorized' is always in the input list.
  }

  return suggestCategoryFlow(input);
}

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: { schema: SuggestCategoryInputSchema },
  output: { schema: SuggestCategoryOutputSchema },
  prompt: `You are an intelligent assistant that helps categorize shopping list items.
Given the item name: "{{itemName}}"

And the following available categories:
{{#each availableCategories}}
- Category Name: "{{this.name}}", ID: "{{this.id}}"
{{/each}}

Suggest the most appropriate category ID from the list above for the item "{{itemName}}".
Your response MUST be one of the provided category IDs.
If no specific category from the list is suitable, and an "uncategorized" category ID is available, please return that "uncategorized" ID.
If "uncategorized" is not available and no other category fits well, you may return an empty string or the ID of the most generic category available.
Focus on selecting the BEST FIT from the provided IDs.
`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await suggestCategoryPrompt(input);
    // Ensure the output is valid and among the available categories, or a defined fallback
    if (output && output.suggestedCategoryId) {
        const isValidSuggestion = input.availableCategories.some(cat => cat.id === output.suggestedCategoryId);
        if (isValidSuggestion || output.suggestedCategoryId === '') {
             return output;
        }
    }
    // Fallback logic if LLM output is not valid or empty
    const uncategorizedCategory = input.availableCategories.find(cat => cat.id.toLowerCase() === 'uncategorized' || cat.name.toLowerCase() === 'uncategorized');
    return { suggestedCategoryId: uncategorizedCategory ? uncategorizedCategory.id : (input.availableCategories[0]?.id || '') };
  }
);
