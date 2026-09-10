import { z } from "zod";
import { today } from "./validation";

export type QuoteItem = {
  description: string;
  quantityHundredths: number;
  unitPricePence: number;
  totalPence: number;
};
export type QuoteState =
  "Draft" | "Sent" | "Accepted" | "Declined" | "Superseded";
export type Quote = {
  id: string;
  leadId: string;
  number: number;
  token: string;
  customerName: string;
  customerLocation: string;
  items: QuoteItem[];
  notes: string;
  validUntil: string;
  totalPence: number;
  state: QuoteState;
  createdAt: string;
  sentAt: string | null;
  respondedAt: string | null;
  version: number;
};
export const validDate = (v: string) =>
  !v ||
  (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v);
const decimal = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Use a positive number with up to two decimal places.",
  );
export const quoteDraftSchema = z
  .object({
    items: z
      .array(
        z.object({
          description: z
            .string()
            .trim()
            .min(1, "Add a description to every item.")
            .max(500),
          quantity: decimal.refine(
            (v) => Number(v) > 0 && Number(v) <= 10000,
            "Quantity must be between 0.01 and 10,000.",
          ),
          price: decimal.refine(
            (v) => Number(v) <= 100000,
            "Unit price must be £100,000 or less.",
          ),
        }),
      )
      .min(1, "Add at least one item.")
      .max(30, "A quote can contain up to 30 items."),
    notes: z.string().trim().max(5000),
    validUntil: z
      .string()
      .refine(
        (v) => validDate(v) && (!v || v >= today()),
        "Choose today or a future valid-until date.",
      ),
  })
  .refine((input) => {
    const total = calculateItems(input.items).reduce(
      (s, i) => s + i.totalPence,
      0,
    );
    return total > 0 && total <= 100000000;
  }, "Quote total must be between £0.01 and £1,000,000.");
export type QuoteDraft = z.infer<typeof quoteDraftSchema>;
export function hundredths(value: string) {
  const [whole, decimal = ""] = value.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}
export function calculateItems(
  items: { description: string; quantity: string; price: string }[],
): QuoteItem[] {
  return items.map((item) => {
    const quantityHundredths = hundredths(item.quantity);
    const unitPricePence = hundredths(item.price);
    return {
      description: item.description,
      quantityHundredths,
      unitPricePence,
      totalPence: Math.round((quantityHundredths * unitPricePence) / 100),
    };
  });
}
export function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
export function quoteNumber(number: number) {
  return `WGC-${String(number).padStart(4, "0")}`;
}
export function quoteExpired(quote: Pick<Quote, "state" | "validUntil">) {
  return (
    quote.state === "Sent" && !!quote.validUntil && quote.validUntil < today()
  );
}
export function quoteLabel(quote: Pick<Quote, "state" | "validUntil">) {
  return quoteExpired(quote) ? "Expired" : quote.state;
}
