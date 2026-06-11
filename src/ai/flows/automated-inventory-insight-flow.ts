"use server";
/**
 * @fileOverview An AI agent that analyzes medicine issuance records to provide restock recommendations.
 *
 * - getRestockRecommendations - A function that handles the restock recommendation process.
 * - InventoryRecordsInput - The input type for the getRestockRecommendations function.
 * - RestockRecommendationOutput - The return type for the getRestockRecommendations function.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const InventoryRecordSchema = z.object({
  date: z.string().describe("The date of medicine issuance (YYYY-MM-DD)."),
  time: z.string().describe("The time of medicine issuance (HH:MM)."),
  name: z.string().describe("Name of the patient."),
  age: z.number().describe("Age of the patient."),
  gender: z.string().describe("Gender of the patient."),
  department: z.string().describe("Department of the patient."),
  chiefComplaints: z
    .string()
    .describe("The chief complaints reported by the patient."),
  medicineTaken: z
    .array(
      z.object({
        name: z.string().describe("Name of the medicine."),
        quantity: z.number().describe("Quantity of the medicine issued."),
        dosage: z.string().describe("Dosage of the medicine."),
      }),
    )
    .describe("List of medicines issued to the patient."),
});

const InventoryRecordsInputSchema = z.object({
  records: z
    .array(InventoryRecordSchema)
    .describe("An array of historical medicine issuance records."),
});

export type InventoryRecordsInput = z.infer<typeof InventoryRecordsInputSchema>;

const RestockRecommendationSchema = z.object({
  medicineName: z
    .string()
    .describe("The name of the medicine recommended for restock."),

  reason: z
    .string()
    .describe(
      "The reason for the restock recommendation, based on chief complaint trends and usage patterns.",
    ),

  priority: z
    .enum(["High", "Medium", "Low"])
    .describe("The urgency of the restock recommendation."),

  suggestedQuantity: z
    .number()
    .optional()
    .describe("An optional suggested quantity for restocking."),
});

const RestockRecommendationOutputSchema = z.object({
  recommendations: z
    .array(RestockRecommendationSchema)
    .describe("A list of medicine restock recommendations."),

  summary: z
    .string()
    .describe(
      "A brief summary of the analysis and the overall inventory status based on trends.",
    ),
});

export type RestockRecommendationOutput = z.infer<
  typeof RestockRecommendationOutputSchema
>;

export async function getRestockRecommendations(
  input: InventoryRecordsInput,
): Promise<RestockRecommendationOutput> {
  return automatedInventoryInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: "automatedInventoryInsightPrompt",

  input: {
    schema: InventoryRecordsInputSchema,
  },

  output: {
    schema: RestockRecommendationOutputSchema,
  },

  prompt: `
You are an AI-powered inventory insight tool for a medical facility.

Your task is to analyze historical medicine issuance records and provide proactive restock recommendations.

Analyze the medicine issuance records below.

Focus on:
- Frequently dispensed medicines
- Trends in chief complaints
- Medicines associated with recurring symptoms
- High-volume medicine usage
- Potential future demand

For each recommendation:
- Provide the medicine name
- Explain why it should be restocked
- Assign a priority level (High, Medium, or Low)
- Suggest a quantity if appropriate

Finally, provide a brief overall summary of the inventory trends.

Medicine Issuance Records:

{{records}}
`,
});

const automatedInventoryInsightFlow = ai.defineFlow(
  {
    name: "automatedInventoryInsightFlow",
    inputSchema: InventoryRecordsInputSchema,
    outputSchema: RestockRecommendationOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);

      if (!output) {
        throw new Error("Failed to generate inventory recommendations.");
      }

      return output;
    } catch (error: unknown) {
      const isQuotaError = 
        (error instanceof Error && error.message.includes("429")) ||
        (typeof error === "object" && error !== null && "code" in error && (error as {code: number}).code === 429);

      if (isQuotaError) {
        console.warn("[Inventory Insights] API quota exceeded. Using fallback analysis.");
      } else {
        console.error("[Inventory Insights] AI service unavailable:", error);
      }

      // Fallback inventory analysis
      const medicineUsage = new Map<string, number>();

      input.records.forEach((record) => {
        record.medicineTaken.forEach((medicine) => {
          const current = medicineUsage.get(medicine.name) ?? 0;

          medicineUsage.set(medicine.name, current + medicine.quantity);
        });
      });

      const recommendations = [...medicineUsage.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([medicineName, totalQuantity]) => {
          const priority: "High" | "Medium" | "Low" =
            totalQuantity >= 50
              ? "High"
              : totalQuantity >= 20
                ? "Medium"
                : "Low";

          return {
            medicineName,
            reason: `${medicineName} was dispensed ${totalQuantity} times in recent records, indicating consistent demand.`,
            priority,
            suggestedQuantity: totalQuantity * 2,
          };
        });

      return {
        recommendations,
        summary: `
AI-powered recommendations are temporarily unavailable.
Fallback analysis was generated using actual medicine issuance records.

Top medicines were identified based on dispensing frequency and quantity issued.
Consider reviewing stock levels for the medicines listed above to avoid shortages.

To restore AI recommendations:
- Upgrade your Google AI API to a paid tier at https://ai.google.dev
- Configure billing details in your Google Cloud Console
        `.trim(),
      };
    }
  },
);
