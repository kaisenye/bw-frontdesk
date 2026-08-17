# AI Front Desk for Sunny Sprouts Learning Center

**Live demo:** [bw-frontdesk.vercel.app](https://bw-frontdesk.vercel.app/) · Parent view `/` · Staff view `/admin`
**Code:** [github.com/kaisenye/bw-frontdesk](https://github.com/kaisenye/bw-frontdesk)

## The problem I chose to solve

Admins lose hours a day to questions that already have written answers. The hard part isn't retrieval, it's **trust**. An AI front desk that confidently invents a tuition rate or clears a feverish child to attend is worse than voicemail, because the parent acts on it. So I optimized for one thing: a parent should be able to tell where an answer came from, and the system should refuse to answer rather than guess.

## Three decisions that shaped the build

**1. Every answer is either cited or escalated. There is no third state.**

The model must return the exact `id` of the single knowledge entry it used. The server then checks that id against the real knowledge base and **drops any citation that doesn't resolve**, downgrading confidence to low. A hallucinated citation is worse than no citation. Parents see a "From: Illness & Fever Policy" chip they can tap to read the center's verbatim written policy, so the answer is auditable in one tap.

**2. Stating policy is different from judging a child.**

This distinction is the heart of the prompt. "What's your fever policy?" is a lookup and gets answered. "My son has a 101 fever and a rash, can he come in?" asks the front desk to make a medical judgment about one child, so it cites the policy for context but hands off to Ms. Rivera with her phone number. The same rule routes billing disputes, custody and authorized-pickup questions, staff complaints, and safety incidents to a human. Sensitive questions aren't a failure mode. Correct routing is a feature.

**3. Gaps are the product, not an error log.**

When no entry covers a question, that's logged as a **knowledge gap**, and the operator dashboard turns it into a one-click "Answer this" that writes a new knowledge entry and marks the gap resolved. Write it once and the front desk handles it from there. That loop is why this gets *better* at a center instead of plateauing, and it's the piece I'd take furthest.

## What's built

- **Parent chat** (mobile-first): suggested questions, grounded answers, tappable source chips that expand the real policy text, distinct escalation cards with a `tel:` link, retry on network failure.
- **Operator control center**: edit, add, and delete knowledge entries with search and category filters. An inbox with honest stats (questions asked, % answered on the spot, sent to staff, gaps) and the gap-to-entry improvement loop.
- **Graceful degradation**: no API key, an OpenAI outage, or malformed model output all produce the same warm "call the center" escalation instead of an error. The demo never shows a stack trace to a parent.

## Scope honesty

Knowledge lives in seed JSON. Operator edits and the question log persist in `localStorage`. That's deliberate for a 3-hour prototype since it makes the demo instant and dependency-free, but it means data is per-browser. The store is a single module (`lib/store.ts`) with a narrow interface, so swapping in Postgres or brightwheel's existing center data is a contained change, not a rewrite.

Answers are grounded by putting the full knowledge base in the prompt. That's the right call at ~10 entries and the wrong one at 500. Real centers would need retrieval over the handbook, plus per-center answer evals to catch regressions when a policy changes.

## What I'd build next

1. **Confidence-gated auto-send.** Let operators set a bar: high-confidence cited answers go out instantly, everything else waits for a one-tap approval. Trust has to be earned per center, not assumed.
2. **Draft-from-gap.** Have the model propose the missing policy text from adjacent entries so the operator edits a draft instead of facing a blank box.
3. **Answer the question behind the question.** "Can my child come in?" is really "will I lose a day of work." Surfacing the sick-day backup options a center already offers is where this stops being a search box and starts being an operating system.
