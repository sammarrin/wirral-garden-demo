import { z } from "zod";
export const statuses = [
  "New",
  "Contacted",
  "Quote Sent",
  "Won",
  "Lost",
] as const;
export type Status = (typeof statuses)[number];
export function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
}
export const quoteSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a phone number.")
    .max(30)
    .regex(/^[+\d\s().-]+$/, "Please enter a valid phone number."),
  location: z
    .string()
    .trim()
    .min(3, "Please enter a postcode or location.")
    .max(120),
  service: z.enum([
    "Garden redesign",
    "Patios & paving",
    "Lawn & turf",
    "Fencing",
    "Garden maintenance",
    "Other",
  ]),
  description: z
    .string()
    .trim()
    .min(20, "Please tell us a little more (at least 20 characters).")
    .max(5000),
  preferredDate: z
    .string()
    .refine(
      (v) =>
        !v ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v &&
          v >= today()),
      "Please choose today or a future date.",
    ),
});
export const updateSchema = z.object({
  status: z.enum(statuses),
  notes: z.string().max(10000, "Notes must be under 10,000 characters."),
  expectedStatus: z.enum(statuses).optional(),
  expectedNotes: z.string().max(10000).optional(),
});
