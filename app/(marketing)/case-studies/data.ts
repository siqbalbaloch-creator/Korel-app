export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  context: {
    who: string;
    inputType: string;
    angle: string;
    profileExcerpt: string;
  };
  sam: {
    thesis: string;
    claim: string;
    objection: string;
    evidence: string[];
  };
  outputs: {
    linkedin: string;
    xHook: string;
    xOutline: string[];
    newsletterIntro: string;
  };
  evaluation: {
    messagingStrength: {
      hookStrength: number;
      claimRobustness: number;
      evidenceDepth: number;
      differentiationClarity: number;
      objectionCoverage: number;
      total: number;
    };
    authorityConsistency: {
      thesisAlignment: number;
      positioningAlignment: number;
      toneMatch: number;
      claimThemeCoherence: number;
      total: number;
    };
    weaknessRadar?: string[];
  };
  outcome: string[];
  beforeAfter?: {
    before: string;
    after: string;
  };
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "founder-interview-to-distribution",
    title: "Founder Interview → Distribution Pack",
    summary:
      "A founder interview turned into a structured authority pack with clearer differentiation and repeatable messaging.",
    context: {
      who: "Seed-stage fintech founder building a compliance workflow platform.",
      inputType: "INTERVIEW",
      angle: "THOUGHT_LEADERSHIP",
      profileExcerpt:
        "Core thesis: compliance wins when teams treat risk as a product, not a checklist.",
    },
    sam: {
      thesis:
        "Compliance programs scale when risk is treated as a product experience, not a legal gate.",
      claim:
        "Treating compliance as product design creates faster approvals and higher internal trust.",
      objection: "Compliance is supposed to slow things down to reduce risk.",
      evidence: [
        "Reduced approval cycles from weeks to days once risk reviews were embedded in the product flow.",
        "Internal stakeholder feedback improved when compliance guidance moved into the workflow.",
      ],
    },
    outputs: {
      linkedin:
        "Compliance doesn’t have to be a gate. When risk is treated as product design, approvals speed up and trust rises. The shift is structural: embed guidance where decisions happen, not after they happen.",
      xHook: "Compliance isn’t a gate. It’s a product surface.",
      xOutline: [
        "Explain why gatekeeping slows decisions without reducing true risk.",
        "Show how embedding guidance in the workflow changes behavior.",
        "Close with the measurable difference: faster approvals, higher trust.",
      ],
      newsletterIntro:
        "Most compliance programs fail because they sit outside the product experience. When risk review is embedded in the workflow, teams move faster and trust the process.",
    },
    evaluation: {
      messagingStrength: {
        hookStrength: 16,
        claimRobustness: 18,
        evidenceDepth: 15,
        differentiationClarity: 17,
        objectionCoverage: 16,
        total: 82,
      },
      authorityConsistency: {
        thesisAlignment: 21,
        positioningAlignment: 20,
        toneMatch: 15,
        claimThemeCoherence: 14,
        total: 70,
      },
      weaknessRadar: ["No recurring issues detected."],
    },
    outcome: [
      "Clearer differentiation between compliance-as-gate vs compliance-as-product.",
      "Stronger thesis consistency across LinkedIn and newsletter assets.",
      "Reduced structural weakness in hooks by anchoring to a single thesis.",
    ],
    beforeAfter: {
      before: "Messaging framed compliance as a cost center with scattered examples.",
      after: "Messaging anchored compliance as a product surface with a repeatable thesis.",
    },
  },
  {
    slug: "investor-update-repositioned",
    title: "Investor Update → Repositioned Authority Pack",
    summary:
      "An investor update reframed into execution-focused authority with measurable credibility signals.",
    context: {
      who: "Series A SaaS operator sharing quarterly execution updates.",
      inputType: "INVESTOR_UPDATE",
      angle: "EXECUTION_FOCUSED",
      profileExcerpt:
        "Positioning: operational excellence for B2B teams that need predictable delivery.",
    },
    sam: {
      thesis:
        "Execution credibility is earned through consistent delivery signals, not optimistic narratives.",
      claim:
        "Weekly delivery metrics build more investor confidence than quarterly storytelling.",
      objection: "Investors want a strong story, not just metrics.",
      evidence: [
        "Weekly release cadence reduced churn in enterprise accounts.",
        "Cycle time improvements were tied directly to onboarded revenue milestones.",
      ],
    },
    outputs: {
      linkedin:
        "Execution credibility isn’t a quarterly story. It’s a weekly signal. Delivery cadence, cycle time, and what changed because of it are the proof investors trust.",
      xHook: "Stop selling progress. Show it.",
      xOutline: [
        "Lead with one operational metric that moved.",
        "Tie the metric to customer outcomes and revenue confidence.",
        "Close with the next measurable milestone.",
      ],
      newsletterIntro:
        "Investors rarely disagree about vision; they evaluate reliability. The fastest way to build credibility is to show how delivery metrics compound into outcomes.",
    },
    evaluation: {
      messagingStrength: {
        hookStrength: 17,
        claimRobustness: 16,
        evidenceDepth: 16,
        differentiationClarity: 15,
        objectionCoverage: 14,
        total: 78,
      },
      authorityConsistency: {
        thesisAlignment: 20,
        positioningAlignment: 22,
        toneMatch: 17,
        claimThemeCoherence: 16,
        total: 75,
      },
      weaknessRadar: ["Watch evidence depth on future updates to keep metrics concrete."],
    },
    outcome: [
      "Sharper positioning around operational excellence.",
      "Improved consistency between investor updates and public-facing content.",
      "Reduced drift by anchoring every claim to measurable delivery signals.",
    ],
    beforeAfter: {
      before: "Updates leaned on narrative momentum without clear operational proof.",
      after: "Updates highlighted delivery metrics that reinforced credibility.",
    },
  },
  {
    slug: "product-update-to-authority",
    title: "Product Update → Authority Pack",
    summary:
      "A routine product update turned into a strategic authority narrative with clearer thesis alignment.",
    context: {
      who: "Product leader at a B2B workflow startup.",
      inputType: "PRODUCT_UPDATE",
      angle: "TACTICAL",
      profileExcerpt:
        "Target audience: operations teams that need predictable handoffs and accountability.",
    },
    sam: {
      thesis:
        "Workflow tools earn adoption when they reduce decision friction, not just task time.",
      claim:
        "Reducing handoff ambiguity drives adoption more than adding new features.",
      objection: "Customers ask for features, not process clarity.",
      evidence: [
        "Usage increased after clarifying handoff ownership in the product.",
        "Support tickets dropped once decision paths were explicit.",
      ],
    },
    outputs: {
      linkedin:
        "Feature velocity is not the adoption lever. Decision clarity is. The fastest wins came from reducing handoff ambiguity, not shipping more buttons.",
      xHook: "Adoption doesn’t come from features. It comes from clarity.",
      xOutline: [
        "Describe the handoff ambiguity that slowed teams.",
        "Show how the update made decisions explicit.",
        "Explain the resulting adoption lift.",
      ],
      newsletterIntro:
        "The product update wasn’t about adding features. It was about removing ambiguity in the handoff sequence so teams could move with confidence.",
    },
    evaluation: {
      messagingStrength: {
        hookStrength: 15,
        claimRobustness: 17,
        evidenceDepth: 14,
        differentiationClarity: 16,
        objectionCoverage: 15,
        total: 77,
      },
      authorityConsistency: {
        thesisAlignment: 19,
        positioningAlignment: 18,
        toneMatch: 16,
        claimThemeCoherence: 15,
        total: 68,
      },
      weaknessRadar: ["Differentiation improving; keep highlighting contrast with feature-first updates."],
    },
    outcome: [
      "Clearer authority narrative around decision clarity.",
      "Stronger alignment between product updates and positioning.",
      "Reduced structural weakness by anchoring updates to a repeatable thesis.",
    ],
    beforeAfter: {
      before: "Product updates listed features without a unifying thesis.",
      after: "Updates tied features to decision clarity and adoption outcomes.",
    },
  },
];

export const CASE_STUDY_SLUGS = CASE_STUDIES.map((study) => study.slug);
