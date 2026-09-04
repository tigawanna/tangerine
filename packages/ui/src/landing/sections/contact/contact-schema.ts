import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "Please enter your name").max(120),
  contact: z.string().max(200),
  message: z.string().min(10, "Please write at least a few words").max(4000),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
