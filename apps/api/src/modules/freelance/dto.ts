import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FreelanceServiceCreateSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().min(1).max(60),
  description: z.string().min(10).max(4000),
  priceFrom: z.number().nonnegative().max(10_000_000).optional(),
  priceUnit: z.string().max(30).optional(),
  skills: z.array(z.string().max(60)).max(30).optional(),
  location: z.string().max(160).optional(),
  isRemote: z.boolean().optional(),
});
export class FreelanceServiceCreateDto extends createZodDto(FreelanceServiceCreateSchema) {}

export const FreelanceInquirySchema = z.object({
  brief: z.string().min(10, 'Brief must be at least 10 characters.').max(4000),
  budgetInr: z.number().int().nonnegative().max(100_000_000).optional(),
  // Accept any date-ish string; the service converts. Kept loose so the
  // browser's <input type="date"> value (YYYY-MM-DD) isn't rejected.
  deadlineAt: z.string().max(40).optional(),
});
export class FreelanceInquiryDto extends createZodDto(FreelanceInquirySchema) {}

export const InquiryStatusSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed', 'cancelled']),
  providerNote: z.string().max(1000).optional(),
});
export class InquiryStatusDto extends createZodDto(InquiryStatusSchema) {}

export const InquiryMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});
export class InquiryMessageDto extends createZodDto(InquiryMessageSchema) {}
