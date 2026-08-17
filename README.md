# AI Front Desk for Sunny Sprouts Learning Center

A prototype AI front desk for a daycare. Parents ask questions and get answers grounded in the center's own written policies; staff manage that source of truth and see what the front desk could not answer.

**Live demo: [bw-frontdesk.vercel.app](https://bw-frontdesk.vercel.app/)**

Two views: `/` for parents, `/admin` for staff.

## Architecture

![Request flow from the parent chat page through the API route and trust gate to one of three outcomes](docs/architecture.png)

A question travels from the chat page to a Next.js API route, which sends the operator-managed knowledge base to the model. The model returns an answer plus the `id` of the entry it claims to have used.

**The trust gate is the point of the whole design.** The server checks that claimed `id` against the real knowledge base before anything reaches the parent, which produces three outcomes:

| Outcome | When | What the parent sees |
| --- | --- | --- |
| Cited answer | The id resolves to a real entry | The answer plus a chip that expands the verbatim policy |
| Escalated | Judgment about a specific child, billing, custody, safety | A card naming the director, with a tappable phone number |
| Logged as gap | No entry covers the question | An honest "I don't have that on file", never a guess |

A `sourceId` the model invents that does not match a real entry is dropped rather than trusted, and confidence is downgraded to low. A fabricated citation would be worse than no citation, since the entire value of the chip is that a parent can verify it.

The dashed line back to the knowledge base is the improvement loop: a gap becomes a one-click "Answer this" in the dashboard, and the front desk handles that question from then on.

## Drafting the answer to a gap

Opening a gap calls a second route, `/api/draft`, which proposes the missing entry from the center's existing policies. It is kept separate from `/api/chat` on purpose: chat's prompt is what the eval suite validates, and a shared route would put that behavior one edit away from a regression.

The rule that makes a draft usable is that it may **never invent a specific**. No price, time, age range, or staff name that isn't already on file. Where one is genuinely needed, it writes a bracketed placeholder and repeats it in an `assumptions` list the operator sees as a checklist:

> Summer camp for older siblings is [available/not available].
> [Add the eligible age range, summer camp dates, hours, and weekly rate].
> For details, call (512) 555-0134 or send a message through the brightwheel app.

The phone number and the brightwheel app came from other entries. Everything the center hasn't decided is a bracket.

Two failure postures, deliberately opposite. Chat never fails loudly, because a parent sees it. Drafting fails visibly, because the operator needs to know to write it themselves, and a fabricated policy is the one output this refuses to produce.

## Evals

```bash
npm run eval
```

17 cases against a running dev server: grounding, the policy-vs-individual-judgment boundary, escalation, honest gaps, follow-up context, prompt injection planted in conversation history, and the citation guard. Needs `npm run dev` in another terminal and `OPENAI_API_KEY` set. Exits non-zero on failure.

## Running it

```bash
npm install
```

Add an OpenAI key (it is only ever read server-side, and `.env*` is gitignored):

```bash
echo 'OPENAI_API_KEY=sk-...' > .env.local
```

```bash
npm run dev
```

Without a key the app still runs. Every request degrades to the same warm "call the center" escalation rather than an error.

## Layout

```
app/
  page.tsx            parent chat
  admin/page.tsx      operator control center
  api/chat/route.ts   grounding, escalation rules, citation validation
lib/
  seed.ts             the fictional center's policies
  store.ts            localStorage persistence for edits and the question log
  types.ts
docs/
  architecture.svg    source for the diagram above
```

## Scope notes

Knowledge lives in seed JSON; operator edits and the question log persist in `localStorage`. That is deliberate for a prototype, since the demo is instant and has no infrastructure to stand up, but data is per-browser. `lib/store.ts` is a single module with a narrow interface, so swapping in a real database is a contained change.

Answers are grounded by putting the full knowledge base in the prompt. That is the right call at ten entries and the wrong one at five hundred; a real center would need retrieval over the handbook and per-center answer evals to catch regressions when a policy changes.

See [SUBMISSION.md](SUBMISSION.md) for the design rationale.
