'use server';
/**
 * @fileOverview An AI agent that analyzes medicine issuance records to provide restock recommendations.
 *
 * - getRestockRecommendations - A function that handles the restock recommendation process.
 * - InventoryRecordsInput - The input type for the getRestockRecommendations function.
 * - RestockRecommendationOutput - The return type for the getRestockRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InventoryRecordSchema = z.object({
  date: z.string().describe('The date of medicine issuance (YYYY-MM-DD).'),
  time: z.string().describe('The time of medicine issuance (HH:MM).'),
  name: z.string().describe('Name of the patient.'),
  age: z.number().describe('Age of the patient.'),
  gender: z.string().describe('Gender of the patient.'),
  department: z.string().describe('Department of the patient.'),
  chiefComplaints: z
    .string()
    .describe('The chief complaints reported by the patient.'),
  medicineTaken: z
    .array(
      z.object({
        name: z.string().describe('Name of the medicine.'),
        quantity: z.number().describe('Quantity of the medicine issued.'),
        dosage: z.string().describe('Dosage of the medicine.'),
      })
    )
    .describe('List of medicines issued to the patient.'),
});

const InventoryRecordsInputSchema = z.object({
  records: z
    .array(InventoryRecordSchema)
    .describe('An array of historical medicine issuance records.'),
});
export type InventoryRecordsInput = z.infer<typeof InventoryRecordsInputSchema>;

const RestockRecommendationSchema = z.object({
  medicineName: z.string().describe('The name of the medicine recommended for restock.'),
  reason: z
    .string()
    .describe(
      'The reason for the restock recommendation, based on chief complaint trends and usage patterns.'
    ),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The urgency of the restock recommendation.'),
  suggestedQuantity: z
    .number()
    .optional()
    .describe('An optional suggested quantity for restocking.'),
});

const RestockRecommendationOutputSchema = z.object({
  recommendations: z
    .array(RestockRecommendationSchema)
    .describe('A list of medicine restock recommendations.'),
  summary: z
    .string()
    .describe(
      'A brief summary of the analysis and the overall inventory status based on trends.'
    ),
});
export type RestockRecommendationOutput = z.infer<
  typeof RestockRecommendationOutputSchema
>;

export async function getRestockRecommendations(
  input: InventoryRecordsInput
): Promise<RestockRecommendationOutput> {
  return automatedInventoryInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedInventoryInsightPrompt',
  input: {schema: InventoryRecordsInputSchema},
  output: {schema: RestockRecommendationOutputSchema},
  prompt: `You are an AI-powered inventory insight tool for a medical facility.
Your task is to analyze historical medicine issuance records and provide proactive restock recommendations.

Analyze the provided JSON array of medicine issuance records. Focus on identifying trends between 'chief complaints' and the 'medicine taken' (including name and quantity).
Based on these trends, suggest specific medicines that need restocking to prevent future shortages.

For each recommendation, provide the medicine name, a clear reason for the recommendation (linking it to chief complaint trends or high usage), and a priority (High, Medium, Low).
Optionally, suggest a quantity for restocking if a strong trend or need is identified.
Finally, provide a brief overall summary of your analysis and the current inventory status based on the trends observed.

Medicine Issuance Records:
{{{JSON.stringify records ' ' 2}}}`,
});

const automatedInventoryInsightFlow = ai.defineFlow(
  {
    name: 'automatedInventoryInsightFlow',
    inputSchema: InventoryRecordsInputSchema,
    outputSchema: RestockRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
