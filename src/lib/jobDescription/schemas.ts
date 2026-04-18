import { z } from 'zod';

export const CreateJdInput = z.object({
  input: z.string().trim().min(1, 'input is required').max(60_000, 'input exceeds 60k chars'),
});

export type CreateJdInputType = z.infer<typeof CreateJdInput>;
