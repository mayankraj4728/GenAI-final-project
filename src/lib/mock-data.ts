import type { Meeting, Speaker } from "./types";

// ---------------------------------------------------------------------------
// A reusable cast of people. Speakers are scoped per-meeting (diarisation is
// per-recording), but we reuse names/initials so analytics feel coherent.
// ---------------------------------------------------------------------------

function spk(
  id: string,
  label: string,
  colorIndex: Speaker["colorIndex"],
  name?: string
): Speaker {
  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : label
        .replace(/[^0-9]/g, "")
        .padStart(1, "S");
  return { id, label, name, colorIndex, initials };
}

// ---------------------------------------------------------------------------
// Meeting 1 — Q3 Product Roadmap Sync (fully detailed)
// ---------------------------------------------------------------------------

const m1Speakers: Speaker[] = [
  spk("m1_s1", "Speaker 1", 1, "Priya Nair"),
  spk("m1_s2", "Speaker 2", 2, "Marcus Lee"),
  spk("m1_s3", "Speaker 3", 3, "Dana Whitfield"),
  spk("m1_s4", "Speaker 4", 4, "Tomás Rivera"),
];

const meeting1: Meeting = {
  id: "mtg_roadmap_q3",
  title: "Q3 Product Roadmap Sync",
  date: "2026-06-10T15:00:00.000Z",
  durationSec: 2_940, // 49m
  status: "ready",
  source: "upload",
  participants: m1Speakers,
  tags: ["roadmap", "search", "infrastructure", "hiring"],
  gist: "Locked the Q3 theme around semantic search and committed to a vector store migration before the August freeze.",
  wer: 0.061,
  summary: {
    attendees: ["Priya Nair", "Marcus Lee", "Dana Whitfield", "Tomás Rivera"],
    keyDecisions: [
      "Q3 will center on the semantic search rollout; everything else is secondary.",
      "Migrate the archive index from Postgres full-text to a managed vector store (pgvector) before the August code freeze.",
      "Hold the mobile redesign to Q4 to protect search headcount.",
    ],
    discussionPoints: [
      "Current keyword search misses ~40% of relevant results in support tickets.",
      "pgvector vs. a dedicated vector DB — team leaned toward pgvector to avoid a new dependency.",
      "Latency budget for search set at 300ms p95.",
      "Need one additional ML engineer to hit the timeline.",
    ],
    openQuestions: [
      "Do we re-embed the full historical archive, or only the last 12 months?",
      "What is the fallback ranking when embeddings are unavailable?",
    ],
    nextSteps: [
      "Marcus to spike a pgvector prototype against the support corpus.",
      "Dana to open the ML engineer req with People Ops.",
      "Priya to draft the Q3 narrative for the all-hands.",
    ],
  },
  transcript: [
    {
      id: "m1_seg1",
      speakerId: "m1_s1",
      start: 12,
      end: 31,
      confidence: 0.97,
      text: "Okay, let's get going. The goal today is to lock the Q3 theme. I want us to walk out of this room with one headline, not five. So — pitches. Marcus, you've been loudest about search.",
    },
    {
      id: "m1_seg2",
      speakerId: "m1_s2",
      start: 32,
      end: 68,
      confidence: 0.95,
      text: "Yeah. Our keyword search is quietly killing us. I pulled the support numbers — when an agent searches the knowledge base, we're missing about forty percent of the genuinely relevant articles because we only match on exact tokens. Semantic search fixes that. If someone types 'login loop', we should find the article titled 'authentication redirect bug'.",
    },
    {
      id: "m1_seg3",
      speakerId: "m1_s3",
      start: 69,
      end: 95,
      confidence: 0.93,
      text: "I'm sold on the problem. My worry is scope. 'Semantic search' can mean a weekend of work or six months. What's the actual surface area? Are we re-embedding everything, are we standing up a new database, who owns it?",
    },
    {
      id: "m1_seg4",
      speakerId: "m1_s2",
      start: 96,
      end: 134,
      confidence: 0.96,
      text: "Fair. The honest version: we move the archive index off Postgres full-text and onto a vector store. My recommendation is pgvector so we don't take on a brand new dependency — it lives in the database we already run. I'd spike a prototype against the support corpus first, measure recall, and then we decide on re-embedding scope.",
    },
    {
      id: "m1_seg5",
      speakerId: "m1_s4",
      start: 135,
      end: 158,
      confidence: 0.92,
      text: "From an infra side, pgvector is the safer bet. A dedicated vector DB means another thing to monitor, back up, and page someone about at 3am. I'd rather push Postgres until it actually breaks. But we need a latency budget — what's acceptable here?",
    },
    {
      id: "m1_seg6",
      speakerId: "m1_s1",
      start: 159,
      end: 171,
      confidence: 0.97,
      text: "Three hundred milliseconds at p95. If search feels slower than the page it lives on, people stop trusting it.",
    },
    {
      id: "m1_seg7",
      speakerId: "m1_s4",
      start: 172,
      end: 201,
      confidence: 0.9,
      text: "Three hundred p95 is doable with pgvector at our scale, assuming we get the indexing right — HNSW, not brute force. I'll want a fallback though. When embeddings are missing or the model's down, we should degrade gracefully back to keyword ranking rather than returning nothing.",
    },
    {
      id: "m1_seg8",
      speakerId: "m1_s3",
      start: 202,
      end: 230,
      confidence: 0.94,
      text: "That fallback question is real and I don't think we should hand-wave it. Let's mark it open. The other open one for me: do we re-embed the entire historical archive, or just the last twelve months? Full re-embed is expensive and most searches hit recent content anyway.",
    },
    {
      id: "m1_seg9",
      speakerId: "m1_s1",
      start: 231,
      end: 252,
      confidence: 0.96,
      text: "Both of those stay open until Marcus's prototype gives us numbers. I don't want to decide re-embedding scope on vibes. Now — the uncomfortable part. Can we do this with the people we have?",
    },
    {
      id: "m1_seg10",
      speakerId: "m1_s2",
      start: 253,
      end: 274,
      confidence: 0.93,
      text: "No. Not if you also want the mobile redesign. We're one ML engineer short to hit an August freeze. If I'm being realistic, something has to give, and I'd rather it be mobile than ship a half-baked search.",
    },
    {
      id: "m1_seg11",
      speakerId: "m1_s3",
      start: 275,
      end: 296,
      confidence: 0.95,
      text: "Then let's say it out loud: mobile redesign moves to Q4. I'll open the ML engineer req with People Ops this week. If we backfill in time, great, we revisit mobile. But search is the headline and I'm not going to starve it.",
    },
    {
      id: "m1_seg12",
      speakerId: "m1_s1",
      start: 297,
      end: 322,
      confidence: 0.97,
      text: "Good. That's the decision. Q3 is semantic search, vector migration before the August freeze, mobile slips to Q4. Marcus spikes the prototype, Dana opens the req, and I'll write the Q3 narrative for the all-hands so the whole company hears the same story. Anything else? No? Done — thank you all.",
    },
  ],
  actionItems: [
    {
      id: "m1_ai1",
      task: "Spike a pgvector prototype against the support corpus and measure recall vs. keyword search",
      ownerId: "m1_s2",
      ownerName: "Marcus Lee",
      deadline: "Next Friday",
      status: "open",
      priority: "high",
      sourceSegmentId: "m1_seg4",
    },
    {
      id: "m1_ai2",
      task: "Open the ML engineer requisition with People Ops",
      ownerId: "m1_s3",
      ownerName: "Dana Whitfield",
      deadline: "This week",
      status: "completed",
      priority: "high",
      sourceSegmentId: "m1_seg11",
    },
    {
      id: "m1_ai3",
      task: "Draft the Q3 narrative for the all-hands",
      ownerId: "m1_s1",
      ownerName: "Priya Nair",
      deadline: "Before all-hands",
      status: "open",
      priority: "medium",
      sourceSegmentId: "m1_seg12",
    },
    {
      id: "m1_ai4",
      task: "Define graceful keyword fallback when embeddings are unavailable",
      ownerId: "m1_s4",
      ownerName: "Tomás Rivera",
      status: "open",
      priority: "medium",
      sourceSegmentId: "m1_seg7",
    },
  ],
};

// ---------------------------------------------------------------------------
// Meeting 2 — Customer Onboarding Retro
// ---------------------------------------------------------------------------

const m2Speakers: Speaker[] = [
  spk("m2_s1", "Speaker 1", 1, "Aisha Khan"),
  spk("m2_s2", "Speaker 2", 5, "Ben Ortiz"),
  spk("m2_s3", "Speaker 3", 3, "Dana Whitfield"),
];

const meeting2: Meeting = {
  id: "mtg_onboarding_retro",
  title: "Customer Onboarding Retro",
  date: "2026-06-08T17:30:00.000Z",
  durationSec: 1_980, // 33m
  status: "ready",
  source: "upload",
  participants: m2Speakers,
  tags: ["onboarding", "customer success", "activation"],
  gist: "Time-to-first-value is the bottleneck; the team agreed to cut the setup wizard from nine steps to four.",
  wer: 0.074,
  summary: {
    attendees: ["Aisha Khan", "Ben Ortiz", "Dana Whitfield"],
    keyDecisions: [
      "Cut the onboarding wizard from nine steps to four.",
      "Send the first 'aha' email at the moment of first successful import, not on a fixed schedule.",
    ],
    discussionPoints: [
      "Median time-to-first-value is 6 days; target is under 1 day.",
      "Steps 5-7 of the wizard have a 60% drop-off.",
      "Customers who import data in week one retain at 3x the rate.",
    ],
    openQuestions: [
      "Can we pre-fill the workspace with sample data so the product never looks empty?",
    ],
    nextSteps: [
      "Ben to mock the 4-step wizard.",
      "Aisha to rewrite the activation email sequence to be event-triggered.",
    ],
  },
  transcript: [
    {
      id: "m2_seg1",
      speakerId: "m2_s1",
      start: 8,
      end: 33,
      confidence: 0.95,
      text: "So the headline from the data is brutal but simple: median time-to-first-value is six days. Six. The customers who actually import their data in the first week retain at three times the rate of the ones who don't. Activation is the whole game and we're losing it in onboarding.",
    },
    {
      id: "m2_seg2",
      speakerId: "m2_s2",
      start: 34,
      end: 61,
      confidence: 0.94,
      text: "I've watched the session recordings and it's painful. The wizard is nine steps. Steps five through seven are where everyone falls off — that's the workspace configuration, the integrations, and the team invite. Sixty percent drop-off right there. People just close the tab.",
    },
    {
      id: "m2_seg3",
      speakerId: "m2_s3",
      start: 62,
      end: 84,
      confidence: 0.92,
      text: "Do those steps even need to be in onboarding? Inviting your team can happen later. Integrations can happen later. The only thing that has to happen for first value is getting their own data in so the product isn't an empty shell.",
    },
    {
      id: "m2_seg4",
      speakerId: "m2_s2",
      start: 85,
      end: 102,
      confidence: 0.95,
      text: "Agreed. I want to cut it to four steps: account, import your data, see your first dashboard, done. Everything else moves into the app as optional prompts. I'll mock the four-step version this week.",
    },
    {
      id: "m2_seg5",
      speakerId: "m2_s1",
      start: 103,
      end: 128,
      confidence: 0.93,
      text: "Love it. And the activation emails are fighting the same battle. Right now they go out on a fixed schedule — day one, day three, day seven — regardless of what the customer actually did. I want to make them event-triggered. The 'here's what you can do next' email should fire the moment someone completes their first successful import, while they're excited.",
    },
    {
      id: "m2_seg6",
      speakerId: "m2_s3",
      start: 129,
      end: 151,
      confidence: 0.9,
      text: "One more idea to chew on — can we pre-fill the workspace with sample data? So even before they import anything, the dashboards have something in them. The empty state is the scariest screen in the product. I'll leave that as an open question, it needs design input.",
    },
    {
      id: "m2_seg7",
      speakerId: "m2_s1",
      start: 152,
      end: 168,
      confidence: 0.94,
      text: "Good open question. Let's not solve it here. Ben mocks the four-step wizard, I'll rewrite the email sequence to be event-triggered, and we revisit sample data once design weighs in. Solid retro, everyone.",
    },
  ],
  actionItems: [
    {
      id: "m2_ai1",
      task: "Mock the redesigned 4-step onboarding wizard",
      ownerId: "m2_s2",
      ownerName: "Ben Ortiz",
      deadline: "This week",
      status: "completed",
      priority: "high",
      sourceSegmentId: "m2_seg4",
    },
    {
      id: "m2_ai2",
      task: "Rewrite the activation email sequence to be event-triggered on first import",
      ownerId: "m2_s1",
      ownerName: "Aisha Khan",
      deadline: "Next sprint",
      status: "open",
      priority: "high",
      sourceSegmentId: "m2_seg5",
    },
  ],
};

// ---------------------------------------------------------------------------
// Meeting 3 — Engineering Standup: Platform
// ---------------------------------------------------------------------------

const m3Speakers: Speaker[] = [
  spk("m3_s1", "Speaker 1", 4, "Tomás Rivera"),
  spk("m3_s2", "Speaker 2", 2, "Marcus Lee"),
  spk("m3_s3", "Speaker 3", 3, "Sofia Berg"),
];

const meeting3: Meeting = {
  id: "mtg_platform_standup",
  title: "Engineering Standup — Platform",
  date: "2026-06-11T09:15:00.000Z",
  durationSec: 840, // 14m
  status: "ready",
  source: "live",
  participants: m3Speakers,
  tags: ["infrastructure", "incident", "deployments"],
  gist: "Resolved the overnight queue backlog; deploy pipeline upgrade is unblocked after the staging fix.",
  wer: 0.083,
  summary: {
    attendees: ["Tomás Rivera", "Marcus Lee", "Sofia Berg"],
    keyDecisions: [
      "Roll the deploy pipeline upgrade to production on Thursday after a 24h staging soak.",
    ],
    discussionPoints: [
      "Overnight job queue backed up to 40k messages; root cause was a stuck consumer.",
      "Staging deploy was failing on a missing migration; now fixed.",
    ],
    openQuestions: [
      "Should we add autoscaling on the consumer pool to prevent backlog recurrence?",
    ],
    nextSteps: [
      "Sofia to add an alert when queue depth exceeds 5k.",
      "Tomás to schedule the Thursday production rollout.",
    ],
  },
  transcript: [
    {
      id: "m3_seg1",
      speakerId: "m3_s1",
      start: 5,
      end: 24,
      confidence: 0.93,
      text: "Quick one today. The overnight page — queue backed up to forty thousand messages around 2am. Sofia, you were on it. What was the root cause?",
    },
    {
      id: "m3_seg2",
      speakerId: "m3_s3",
      start: 25,
      end: 52,
      confidence: 0.91,
      text: "Stuck consumer. One worker grabbed a poison message, threw on it, and didn't release the lease, so the whole partition stalled behind it. I killed the worker, the backlog drained in about twenty minutes. The real fix is we need an alert before it gets to forty thousand — I'll add one at five thousand queue depth.",
    },
    {
      id: "m3_seg3",
      speakerId: "m3_s2",
      start: 53,
      end: 71,
      confidence: 0.94,
      text: "And the deploy pipeline upgrade — I unblocked staging. It was failing on a migration that never got checked in. It's in now, staging is green. I'd want a full twenty-four hour soak before we touch production though.",
    },
    {
      id: "m3_seg4",
      speakerId: "m3_s1",
      start: 72,
      end: 89,
      confidence: 0.92,
      text: "Then let's roll to production Thursday, after the soak. I'll schedule it. Open question I want us to think about — do we put autoscaling on the consumer pool so a backlog like last night just absorbs itself? Park it, we'll discuss next week.",
    },
  ],
  actionItems: [
    {
      id: "m3_ai1",
      task: "Add an alert when job queue depth exceeds 5,000 messages",
      ownerId: "m3_s3",
      ownerName: "Sofia Berg",
      deadline: "Today",
      status: "completed",
      priority: "high",
      sourceSegmentId: "m3_seg2",
    },
    {
      id: "m3_ai2",
      task: "Schedule the deploy pipeline production rollout for Thursday",
      ownerId: "m3_s1",
      ownerName: "Tomás Rivera",
      deadline: "Thursday",
      status: "open",
      priority: "medium",
      sourceSegmentId: "m3_seg4",
    },
  ],
};

// ---------------------------------------------------------------------------
// Meeting 4 — Design Review: Search Experience
// ---------------------------------------------------------------------------

const m4Speakers: Speaker[] = [
  spk("m4_s1", "Speaker 1", 5, "Ben Ortiz"),
  spk("m4_s2", "Speaker 2", 1, "Priya Nair"),
  spk("m4_s3", "Speaker 3", 2, "Marcus Lee"),
  spk("m4_s4", "Speaker 4", 3, "Sofia Berg"),
];

const meeting4: Meeting = {
  id: "mtg_design_search",
  title: "Design Review: Search Experience",
  date: "2026-06-05T14:00:00.000Z",
  durationSec: 2_460, // 41m
  status: "ready",
  source: "upload",
  participants: m4Speakers,
  tags: ["search", "design", "ux"],
  gist: "Approved a command-palette style search with inline result previews; results must show why they matched.",
  wer: 0.069,
  summary: {
    attendees: ["Ben Ortiz", "Priya Nair", "Marcus Lee", "Sofia Berg"],
    keyDecisions: [
      "Adopt a command-palette (⌘K) entry point for search across the app.",
      "Every result must show a highlighted snippet explaining why it matched.",
    ],
    discussionPoints: [
      "Users distrust results they can't explain — relevance needs to be visible.",
      "Keyboard-first interaction for power users; click targets for everyone else.",
    ],
    openQuestions: [
      "How do we present semantic matches that share no literal keywords with the query?",
    ],
    nextSteps: [
      "Ben to ship the high-fidelity ⌘K prototype.",
      "Marcus to expose match-reason metadata from the search API.",
    ],
  },
  transcript: [
    {
      id: "m4_seg1",
      speakerId: "m4_s1",
      start: 10,
      end: 36,
      confidence: 0.94,
      text: "What I'm showing is a command-palette pattern — you hit Command-K from anywhere, the palette drops down, you type, and results stream in live underneath. It's the same muscle memory people already have from their editor and from Slack. Search shouldn't be a place you navigate to, it should be a thing you summon.",
    },
    {
      id: "m4_seg2",
      speakerId: "m4_s2",
      start: 37,
      end: 58,
      confidence: 0.96,
      text: "I like the summon framing. My one hard requirement: every result has to show why it matched. A highlighted snippet, the speaker, the meeting. If semantic search returns something that doesn't share a single word with my query, and I can't see the reasoning, I won't trust it — and then I stop using it.",
    },
    {
      id: "m4_seg3",
      speakerId: "m4_s3",
      start: 59,
      end: 82,
      confidence: 0.92,
      text: "That's actually the hard part technically and I want to flag it as open. With semantic matches, the 'why' isn't a keyword highlight — there may be no shared keyword. We'd have to surface the surrounding sentence and maybe a relevance score. I can expose match-reason metadata from the API but we need design to decide how to render a match that has no literal overlap.",
    },
    {
      id: "m4_seg4",
      speakerId: "m4_s4",
      start: 83,
      end: 101,
      confidence: 0.91,
      text: "Keyboard-first is great for us but let's not punish the people who reach for a mouse. The palette needs real click targets, not just arrow-key navigation. As long as both paths work, I'm happy with the direction.",
    },
    {
      id: "m4_seg5",
      speakerId: "m4_s2",
      start: 102,
      end: 119,
      confidence: 0.95,
      text: "Then we're aligned. Command-K palette, live results, every hit shows its matched snippet. Ben takes the high-fidelity prototype, Marcus exposes the match-reason data, and we leave 'how to render a no-keyword semantic match' as the open design question. Good review.",
    },
  ],
  actionItems: [
    {
      id: "m4_ai1",
      task: "Ship the high-fidelity ⌘K search palette prototype",
      ownerId: "m4_s1",
      ownerName: "Ben Ortiz",
      deadline: "Two weeks",
      status: "open",
      priority: "high",
      sourceSegmentId: "m4_seg5",
    },
    {
      id: "m4_ai2",
      task: "Expose match-reason metadata from the search API",
      ownerId: "m4_s3",
      ownerName: "Marcus Lee",
      deadline: "Next sprint",
      status: "open",
      priority: "medium",
      sourceSegmentId: "m4_seg3",
    },
  ],
};

// ---------------------------------------------------------------------------
// Meeting 5 — Weekly Leadership Sync
// ---------------------------------------------------------------------------

const m5Speakers: Speaker[] = [
  spk("m5_s1", "Speaker 1", 1, "Priya Nair"),
  spk("m5_s2", "Speaker 2", 3, "Dana Whitfield"),
  spk("m5_s3", "Speaker 3", 5, "Ben Ortiz"),
];

const meeting5: Meeting = {
  id: "mtg_leadership_sync",
  title: "Weekly Leadership Sync",
  date: "2026-06-01T16:00:00.000Z",
  durationSec: 2_700, // 45m
  status: "ready",
  source: "upload",
  participants: m5Speakers,
  tags: ["hiring", "budget", "roadmap"],
  gist: "Headcount approved for one ML engineer; marketing spend reallocated toward the search launch.",
  wer: 0.078,
  summary: {
    attendees: ["Priya Nair", "Dana Whitfield", "Ben Ortiz"],
    keyDecisions: [
      "Approve one additional ML engineer headcount for Q3.",
      "Reallocate 15% of the marketing budget toward the semantic search launch.",
    ],
    discussionPoints: [
      "Pipeline is healthy but engineering is the constraint, not demand.",
      "Search launch needs a coordinated marketing moment, not a silent ship.",
    ],
    openQuestions: ["Do we announce search at the user conference or before it?"],
    nextSteps: [
      "Dana to finalize the headcount plan with Finance.",
      "Ben to draft the search launch marketing brief.",
    ],
  },
  transcript: [
    {
      id: "m5_seg1",
      speakerId: "m5_s1",
      start: 14,
      end: 38,
      confidence: 0.95,
      text: "Two real decisions on the table today. One, the ML engineer headcount that came out of the roadmap sync. Two, how we fund the search launch. Let's take headcount first — Dana?",
    },
    {
      id: "m5_seg2",
      speakerId: "m5_s2",
      start: 39,
      end: 64,
      confidence: 0.93,
      text: "I've run the numbers and I'm comfortable approving one ML engineer for Q3. The thing I keep coming back to is that our constraint isn't demand — the pipeline is healthy. The constraint is engineering throughput. Adding the role directly unblocks the thing customers are asking for.",
    },
    {
      id: "m5_seg3",
      speakerId: "m5_s3",
      start: 65,
      end: 91,
      confidence: 0.92,
      text: "On funding — I don't want us to build the best search in the category and then ship it in silence. I'd reallocate about fifteen percent of the marketing budget toward a real launch moment. The open question for me is timing: do we announce at the user conference, or do we go before it so we own the news cycle?",
    },
    {
      id: "m5_seg4",
      speakerId: "m5_s1",
      start: 92,
      end: 114,
      confidence: 0.96,
      text: "Headcount approved, budget reallocation approved, launch timing stays open until we see the prototype numbers. Dana, finalize the headcount plan with Finance. Ben, draft the launch marketing brief. We'll decide conference-or-before next week.",
    },
  ],
  actionItems: [
    {
      id: "m5_ai1",
      task: "Finalize the ML engineer headcount plan with Finance",
      ownerId: "m5_s2",
      ownerName: "Dana Whitfield",
      deadline: "This week",
      status: "completed",
      priority: "high",
      sourceSegmentId: "m5_seg4",
    },
    {
      id: "m5_ai2",
      task: "Draft the semantic search launch marketing brief",
      ownerId: "m5_s3",
      ownerName: "Ben Ortiz",
      deadline: "Next week",
      status: "open",
      priority: "medium",
      sourceSegmentId: "m5_seg4",
    },
  ],
};

// ---------------------------------------------------------------------------
// Meeting 6 — Currently processing (no derived content yet)
// ---------------------------------------------------------------------------

const meeting6: Meeting = {
  id: "mtg_sales_pipeline",
  title: "Sales Pipeline Review — June",
  date: "2026-06-11T11:00:00.000Z",
  durationSec: 1_620, // 27m
  status: "processing",
  source: "upload",
  participants: [],
  tags: [],
  gist: "Transcribing and analysing… your structured summary will be ready shortly.",
  summary: {
    attendees: [],
    keyDecisions: [],
    discussionPoints: [],
    openQuestions: [],
    nextSteps: [],
  },
  transcript: [],
  actionItems: [],
};

export const MEETINGS: Meeting[] = [
  meeting3, // today
  meeting6, // today, processing
  meeting1,
  meeting2,
  meeting4,
  meeting5,
];

export function getMeeting(id: string): Meeting | undefined {
  return MEETINGS.find((m) => m.id === id);
}

export const READY_MEETINGS = MEETINGS.filter((m) => m.status === "ready");
