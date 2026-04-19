import { z } from 'zod';

// `source` is an explicit client-intent hint from the "Paste Text" / "Enter URL"
// toggle. Optional so legacy callers still work (in which case the parser
// falls back to a strict whole-string URL match, not a `.includes('://')`
// heuristic — see PR #60 comment 4274999164).
export const CreateJdInput = z.object({
  input: z.string().trim().min(1, 'input is required').max(60_000, 'input exceeds 60k chars'),
  source: z.enum(['paste', 'url']).optional(),
});

export type CreateJdInputType = z.infer<typeof CreateJdInput>;
