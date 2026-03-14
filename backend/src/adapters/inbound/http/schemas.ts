import { z } from "zod";

export const bankingSchema = z.object({
  shipId: z.string().min(1),
  year: z.number().int(),
  amountGco2eq: z.number().positive()
});

export const applyBankingSchema = z.object({
  sourceShipId: z.string().min(1),
  sourceYear: z.number().int(),
  targetShipId: z.string().min(1),
  targetYear: z.number().int(),
  amountGco2eq: z.number().positive()
});

export const createPoolSchema = z.object({
  year: z.number().int(),
  members: z.array(
    z.object({
      shipId: z.string().min(1),
      year: z.number().int(),
      adjustedCb: z.number()
    })
  )
});

