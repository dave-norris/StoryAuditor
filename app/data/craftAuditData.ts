export interface AuditItem {
  name: string;
  description: string;
}

export interface AuditCategory {
  name: string;
  items: AuditItem[];
}

export const CRAFT_AUDIT_CATEGORIES: AuditCategory[] = [
  {
    name: "Setup & Payoff",
    items: [
      {
        name: "Chekhov's Gun Audit",
        description:
          "Identifies every significant element introduced early in the narrative and verifies whether it pays off later, flagging setups that never resolve.",
      },
      {
        name: "Red Herring vs. Abandoned Thread Audit",
        description:
          "Distinguishes intentional misdirections from plot threads the author dropped unintentionally, ensuring every loose end is deliberate.",
      },
      {
        name: "Foreshadowing Density & Twist Fairness Audit",
        description:
          "Measures how evenly foreshadowing is distributed and whether twists are supported by prior clues so readers feel surprised but not cheated.",
      },
      {
        name: "MacGuffin Clarity Audit",
        description:
          "Evaluates whether the object or goal driving the plot is clearly established and consistently motivates character actions throughout the story.",
      },
    ],
  },
  {
    name: "Reader Engagement & Psychology",
    items: [
      {
        name: "Zeigarnik Effect / Open Loop Audit",
        description:
          "Tracks open questions and unresolved tensions that keep readers turning pages, ensuring loops are opened intentionally and closed satisfyingly.",
      },
      {
        name: "Dramatic Irony Audit",
        description:
          "Identifies moments where the reader knows more than the characters and assesses whether that gap creates tension, humor, or dread as intended.",
      },
      {
        name: "Stakes Escalation Audit",
        description:
          "Charts how stakes rise across the narrative arc, flagging plateaus or reversals that may cause reader disengagement.",
      },
    ],
  },
  {
    name: "Structure & Pacing",
    items: [
      {
        name: "Story Beat Placement Audit",
        description:
          "Maps key structural beats against established story frameworks and highlights beats that arrive too early, too late, or are missing entirely.",
      },
      {
        name: "Scene/Sequel (Action/Reaction) Balance Audit",
        description:
          "Analyzes the ratio of high-action scenes to reflective sequel passages, ensuring readers get breathing room without momentum loss.",
      },
      {
        name: "Show vs. Tell at Key Moments Audit",
        description:
          "Pinpoints critical emotional or plot moments where the narrative tells rather than shows, suggesting where dramatization would strengthen impact.",
      },
      {
        name: "Timeline Juxtaposition / Flashback Audit",
        description:
          "Evaluates whether timeline shifts and flashbacks clarify the story or confuse readers, checking for clear transitions and narrative purpose.",
      },
    ],
  },
  {
    name: "Character & Theme",
    items: [
      {
        name: "Want vs. Need Audit",
        description:
          "Examines whether each major character has a clear external want and internal need, and whether the tension between them drives meaningful growth.",
      },
      {
        name: "Thematic Throughline Audit",
        description:
          "Traces the central theme across scenes, subplots, and character arcs to ensure it is reinforced consistently without becoming heavy-handed.",
      },
      {
        name: "Mirror/Foil Character Audit",
        description:
          "Identifies character pairings that reflect or contrast each other and assesses whether those relationships illuminate theme and deepen characterization.",
      },
      {
        name: "Point-of-View Discipline Audit",
        description:
          "Checks for unintentional POV shifts, head-hopping, or information leaks that break the chosen narrative perspective.",
      },
    ],
  },
  {
    name: "Series-Level Craft Audits",
    items: [
      {
        name: "Cross-Book Setup/Payoff Audit",
        description:
          "Tracks setups planted in earlier books and verifies they pay off in subsequent installments, preventing series-spanning loose ends.",
      },
      {
        name: "Series Pacing Comparator",
        description:
          "Compares pacing curves across multiple books in a series to identify installments that sag or rush relative to the overall series rhythm.",
      },
      {
        name: "Recurring Motif/Theme Tracker (Series)",
        description:
          "Monitors recurring symbols, phrases, and thematic elements across the series to ensure cohesion and intentional evolution over time.",
      },
    ],
  },
];
