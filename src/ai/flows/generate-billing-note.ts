'use server';
/**
 * @fileOverview A Genkit flow for generating personalized closing notes for customer bills.
 *
 * - generateBillingNote - A function that generates a personalized closing note.
 * - GenerateBillingNoteInput - The input type for the generateBillingNote function.
 * - GenerateBillingNoteOutput - The return type for the generateBillingNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBillingNoteInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  totalAmount: z.number().describe('The total amount of the bill.'),
  itemsPurchased: z.array(z.string()).describe('A list of items purchased by the customer.'),
  date: z.string().describe('The date of the bill in a human-readable format (e.g., "January 1, 2024").'),
});
export type GenerateBillingNoteInput = z.infer<typeof GenerateBillingNoteInputSchema>;

const GenerateBillingNoteOutputSchema = z.string().describe('A brief, polite, and customized closing note for the customer bill.');
export type GenerateBillingNoteOutput = z.infer<typeof GenerateBillingNoteOutputSchema>;

export async function generateBillingNote(input: GenerateBillingNoteInput): Promise<GenerateBillingNoteOutput> {
  return generateBillingNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBillingNotePrompt',
  input: {schema: GenerateBillingNoteInputSchema},
  output: {schema: GenerateBillingNoteOutputSchema},
  prompt: `You are an AI assistant tasked with generating a brief, polite, and customized closing note for a customer bill.

Use the following order details to craft the note:
Customer Name: {{{customerName}}}
Total Amount: {{{totalAmount}}}
Items Purchased: {{#each itemsPurchased}}- {{{this}}}\n{{/each}}
Date: {{{date}}}

The note should be appreciative, professional, and slightly personalized based on the details provided. Keep it concise, around 1-2 sentences.

Example:
"Thank you, Mr. Smith, for your purchase of $150.00 today! We hope you enjoy your new items and look forward to serving you again soon."

Now, generate the closing note:`,
});

const generateBillingNoteFlow = ai.defineFlow(
  {
    name: 'generateBillingNoteFlow',
    inputSchema: GenerateBillingNoteInputSchema,
    outputSchema: GenerateBillingNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate billing note.');
    }
    return output;
  }
);
