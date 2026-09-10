import { z } from "zod";

export const AnalysisSchema = z.object({
  summary: z.string().min(1),
  actions: z.array(z.string().min(1)).min(1),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
