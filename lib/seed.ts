import type { KnowledgeEntry, QuestionLogItem } from "./types";

export const CENTER = {
  name: "Sunny Sprouts Learning Center",
  shortName: "Sunny Sprouts",
  director: "Ms. Rivera",
  phone: "(512) 555-0134",
  address: "1420 Meadowlark Ln, Austin, TX",
};

const STAMP = "2026-08-10T09:00:00.000Z";

export const SEED_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "hours",
    title: "Hours & Daily Schedule",
    category: "hours",
    updatedAt: STAMP,
    body: `We are open Monday through Friday, 7:00 AM to 6:00 PM. We are closed on weekends.

Drop-off window is 7:00–9:00 AM. Please arrive before 9:00 AM so your child does not miss morning circle time.
Standard pickup is between 4:00 and 6:00 PM.

Daily rhythm: 7:00 arrival & free play, 9:00 circle time, 9:30 learning centers, 11:15 outdoor play, 12:00 lunch, 1:00–3:00 nap/quiet time, 3:15 snack, 3:45 outdoor play, 4:00–6:00 pickup.`,
  },
  {
    id: "calendar",
    title: "Holiday Calendar & Closures",
    category: "hours",
    updatedAt: STAMP,
    body: `Sunny Sprouts is CLOSED on these days for the 2026–2027 school year:

- Labor Day: Monday, September 7, 2026
- Veterans Day: Wednesday, November 11, 2026 (CLOSED)
- Thanksgiving: Thursday & Friday, November 26–27, 2026
- Winter Break: December 24, 2026 through January 1, 2027
- Martin Luther King Jr. Day: Monday, January 18, 2027
- Memorial Day: Monday, May 31, 2027
- Staff Development Days: Friday, October 9, 2026 and Friday, February 12, 2027 (CLOSED, no childcare)
- Independence Day: Monday, July 5, 2027

Tuition is not reduced for holiday closures; these days are built into the annual tuition rate.
We remain OPEN on Columbus Day, Presidents' Day, and Halloween.`,
  },
  {
    id: "tuition",
    title: "Tuition & Fees",
    category: "tuition",
    updatedAt: STAMP,
    body: `Weekly tuition, billed every Monday:

- Infants (6 weeks to 17 months): $385/week
- Toddlers (18 months to 2 years): $340/week
- Preschool (3 to 4 years): $295/week
- Pre-K (4 to 5 years): $275/week

Part-time (3 days/week) is available for Preschool and Pre-K only at 70% of the full-time rate.

Other fees:
- Annual registration fee: $150 per family, due at enrollment and each September
- Supply fee: $75 per child, charged in September and January
- Sibling discount: 10% off the lower-tuition child

Payment is due Monday by 6:00 PM through the brightwheel app. A $25 late fee applies after Wednesday.`,
  },
  {
    id: "illness",
    title: "Illness & Fever Policy",
    category: "health",
    updatedAt: STAMP,
    body: `Children must stay home if they have any of the following:

- Fever of 100.4°F or higher
- Vomiting or diarrhea within the last 24 hours
- An unexplained rash
- Eye discharge or pink eye symptoms
- A persistent cough that interferes with normal activity
- Any contagious illness (hand-foot-and-mouth, strep, flu, COVID-19, lice)

RETURN RULE: A child must be fever-free for a full 24 hours WITHOUT fever-reducing medication (Tylenol, Motrin) before returning. The same 24-hour rule applies to vomiting and diarrhea.

For strep throat or another bacterial infection, a child may return 24 hours after starting antibiotics.

If a child develops a fever during the day, we will call you and ask that they be picked up within one hour.

We cannot make medical judgments about whether a specific child is well enough to attend. When in doubt, call your pediatrician.`,
  },
  {
    id: "medication",
    title: "Medication Administration",
    category: "health",
    updatedAt: STAMP,
    body: `We can administer medication only with a signed Medication Authorization Form on file.

Requirements:
- Medication must be in the original container with a pharmacy label showing the child's name
- Prescription medication must include the prescribing doctor's instructions
- Over-the-counter medication requires a doctor's note for children under 2
- We cannot administer the first dose of any new medication

Emergency medication (EpiPen, inhaler, Diastat) requires an individual Health Care Plan completed with Ms. Rivera before the child's first day.`,
  },
  {
    id: "lunch",
    title: "Meals & Lunch Program",
    category: "food",
    updatedAt: STAMP,
    body: `Sunny Sprouts provides a hot lunch plus a morning and afternoon snack, included in tuition. Families do NOT need to pack lunch.

If you forget to pack anything, we always have a meal for your child, so just let a teacher know at drop-off. There is no extra charge.

Rotating two-week menu, current week:
- Monday: Turkey & cheese roll-ups, steamed carrots, apple slices, milk
- Tuesday: Cheese quesadilla, black beans, orange wedges, milk
- Wednesday: Whole wheat pasta with marinara, green beans, pears, milk
- Thursday: Chicken & rice bowl, broccoli, banana, milk
- Friday: Veggie pizza, cucumber slices, strawberries, milk

Snacks are fruit, whole-grain crackers, cheese, or yogurt.

We are a NUT-FREE center. Please do not send any food containing peanuts or tree nuts.

Allergies and dietary restrictions are accommodated with a completed Food Allergy Form. Infants follow a parent-provided feeding plan; we supply formula only if it matches the family's brand.`,
  },
  {
    id: "tours",
    title: "Tours, Waitlist & Enrollment",
    category: "enrollment",
    updatedAt: STAMP,
    body: `Tours are offered Tuesday and Thursday at 9:30 AM and 2:00 PM, and last about 30 minutes. Ms. Rivera leads every tour personally.

To schedule, call (512) 555-0134 or request a tour in the brightwheel app. We ask that children come along so they can see the classroom.

Enrollment steps:
1. Tour the center
2. Submit the enrollment application and $150 registration fee
3. Complete health forms, including an up-to-date immunization record
4. Schedule a two-hour transition visit before the first full day

Current waitlist as of August 2026: Infant room approximately 3 months, Toddler room approximately 6 weeks, Preschool and Pre-K have immediate openings.`,
  },
  {
    id: "late-pickup",
    title: "Late Pickup Policy",
    category: "policies",
    updatedAt: STAMP,
    body: `Pickup closes at 6:00 PM. A late fee of $1 per minute per child begins at 6:01 PM and is billed to your account.

If you know you will be late, call (512) 555-0134 as soon as possible so we can reassure your child.

Anyone picking up must be listed on your child's Authorized Pickup list and must show photo ID. We will not release a child to an adult who is not on the list, even if the parent calls to authorize it. The list has to be updated in writing through the brightwheel app.

After three late pickups in a rolling month, Ms. Rivera will schedule a conversation about scheduling options.`,
  },
  {
    id: "what-to-bring",
    title: "What to Bring Each Day",
    category: "policies",
    updatedAt: STAMP,
    body: `Please send each day, labeled with your child's name:

- A full change of clothes (two sets for children who are potty training)
- Diapers and wipes for children not yet potty trained
- A crib sheet and small blanket for nap (sent home Fridays to wash)
- A refillable water bottle
- Weather-appropriate outerwear, since we go outside every day unless it is below 40°F or raining

Please leave at home: toys from home, jewelry, anything with peanuts or tree nuts, and open-toed shoes or flip-flops.

Sunscreen is applied by staff with a signed permission form. We supply it, or you may send your own.`,
  },
  {
    id: "contact",
    title: "Contact & Staff",
    category: "contact",
    updatedAt: STAMP,
    body: `Sunny Sprouts Learning Center
1420 Meadowlark Ln, Austin, TX 78704
Phone: (512) 555-0134
Email: hello@sunnysprouts.example

Director: Ms. Rivera handles enrollment, tuition questions, concerns about your child, and anything urgent.
Assistant Director: Mr. Chen handles daily schedules, classroom placement, and staffing.

The fastest way to reach a teacher during the day is a message through the brightwheel app. For anything urgent, please call. We answer the phone between 7:00 AM and 6:00 PM.`,
  },
];

/**
 * Pre-seeded so the operator inbox tells a story on first load:
 * healthy answered volume, one sensitive escalation, one real knowledge gap.
 */
export const SEED_LOG: QuestionLogItem[] = [
  {
    id: "log-1",
    question: "Are you open on Veterans Day?",
    answer:
      "We're closed on Veterans Day, Wednesday, November 11, 2026. We'll be back open Thursday at 7:00 AM.",
    status: "answered",
    sourceId: "calendar",
    askedAt: "2026-08-15T14:22:00.000Z",
  },
  {
    id: "log-2",
    question: "What is the tuition for infants?",
    answer:
      "Infant tuition (6 weeks to 17 months) is $385 per week, billed each Monday through the brightwheel app.",
    status: "answered",
    sourceId: "tuition",
    askedAt: "2026-08-15T15:04:00.000Z",
  },
  {
    id: "log-3",
    question: "My daughter had a fever of 101 last night. Can she come in today?",
    answer:
      "She'll need to be fever-free for a full 24 hours without fever-reducing medication before returning.",
    status: "answered",
    sourceId: "illness",
    askedAt: "2026-08-15T21:40:00.000Z",
  },
  {
    id: "log-4",
    question: "I forgot to pack lunch. Can you provide lunch today and what is it?",
    answer:
      "Lunch is always included, so no need to pack. Today is cheese quesadilla, black beans, and orange wedges.",
    status: "answered",
    sourceId: "lunch",
    askedAt: "2026-08-16T07:52:00.000Z",
  },
  {
    id: "log-5",
    question: "How can I schedule a tour?",
    answer:
      "Tours run Tuesdays and Thursdays at 9:30 AM and 2:00 PM. Call (512) 555-0134 or request one in the brightwheel app.",
    status: "answered",
    sourceId: "tours",
    askedAt: "2026-08-16T08:15:00.000Z",
  },
  {
    id: "log-6",
    question:
      "Miles fell off the climber yesterday and hit his head. He seems okay but is a little sleepy. Should I keep him home?",
    answer:
      "Passed to Ms. Rivera. Head injury follow-up is a medical judgment the front desk should not make.",
    status: "escalated",
    sourceId: null,
    askedAt: "2026-08-16T06:30:00.000Z",
  },
  {
    id: "log-7",
    question: "Do you offer any summer camp for older siblings?",
    answer: "No knowledge entry covers summer camp for school-age siblings.",
    status: "gap",
    sourceId: null,
    askedAt: "2026-08-15T18:11:00.000Z",
  },
  {
    id: "log-8",
    question: "What's your policy on birthday treats in the classroom?",
    answer: "No knowledge entry covers classroom birthday celebrations.",
    status: "gap",
    sourceId: null,
    askedAt: "2026-08-16T09:05:00.000Z",
  },
];

export const SUGGESTED_QUESTIONS = [
  "Are you open on Veterans Day?",
  "What is the tuition for infants?",
  "My child has a fever, can they come in?",
  "I forgot to pack lunch. What's for lunch today?",
  "How can I schedule a tour?",
];
