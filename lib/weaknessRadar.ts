import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";

export type WeaknessRadarIssue = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  evidence: {
    affectedPacks: number;
    rate: number;
    examples?: string[];
  };
  recommendation: string;
};

export type WeaknessRadar = {
  windowSize: number;
  generatedAt: string;
  issues: WeaknessRadarIssue[];
};

type MessagingStrength = {
  hookStrength: number;
  claimRobustness: number;
  evidenceDepth: number;
  differentiationClarity: number;
  objectionCoverage: number;
  total: number;
};

type AuthorityConsistency = {
  thesisAlignment: number;
  positioningAlignment: number;
  toneMatch: number;
  claimThemeCoherence: number;
  driftWarnings: string[];
  total: number;
};

type RadarPack = {
  id: string;
  title: string;
  createdAt: Date;
  strategicMap: Prisma.JsonValue | null;
  messagingStrength: Prisma.JsonValue | null;
  authorityConsistency: Prisma.JsonValue | null;
};

const WINDOW_SIZE = 10;
const MIN_PACKS = 3;
const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { expiresAt: number; radar: WeaknessRadar; analyzed: number }>();

const toNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const parseMessagingStrength = (value: Prisma.JsonValue | null): MessagingStrength | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const total = toNumber(record.total);
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    hookStrength: toNumber(record.hookStrength),
    claimRobustness: toNumber(record.claimRobustness),
    evidenceDepth: toNumber(record.evidenceDepth),
    differentiationClarity: toNumber(record.differentiationClarity),
    objectionCoverage: toNumber(record.objectionCoverage),
    total,
  };
};

const parseAuthorityConsistency = (value: Prisma.JsonValue | null): AuthorityConsistency | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const total = toNumber(record.total);
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    thesisAlignment: toNumber(record.thesisAlignment),
    positioningAlignment: toNumber(record.positioningAlignment),
    toneMatch: toNumber(record.toneMatch),
    claimThemeCoherence: toNumber(record.claimThemeCoherence),
    driftWarnings: toStringArray(record.driftWarnings),
    total,
  };
};

const severityFromRate = (rate: number): WeaknessRadarIssue["severity"] => {
  if (rate >= 0.5) return "high";
  if (rate >= 0.35) return "medium";
  if (rate >= 0.25) return "low";
  return "low";
};

const buildIssue = (
  id: string,
  title: string,
  affected: RadarPack[],
  denominator: number,
  recommendation: string,
): WeaknessRadarIssue => {
  const rate = denominator > 0 ? affected.length / denominator : 0;
  const examples = affected.slice(0, 3).map((pack) => pack.title);
  return {
    id,
    title,
    severity: severityFromRate(rate),
    evidence: {
      affectedPacks: affected.length,
      rate: Number(rate.toFixed(2)),
      examples: examples.length ? examples : undefined,
    },
    recommendation,
  };
};

const rateMeetsThreshold = (rate: number): boolean => rate >= 0.25;

export function computeWeaknessRadar(packs: RadarPack[], windowSize = WINDOW_SIZE): { radar: WeaknessRadar; analyzed: number } {
  const generatedAt = new Date().toISOString();
  const recent = packs.slice(0, windowSize);
  const analyzedPacks = recent.filter((pack) => pack.strategicMap);
  const analyzed = analyzedPacks.length;

  if (analyzed < MIN_PACKS) {
    return {
      radar: { windowSize, generatedAt, issues: [] },
      analyzed,
    };
  }

  const withMessaging = analyzedPacks.map((pack) => ({
    pack,
    ms: parseMessagingStrength(pack.messagingStrength),
  }));

  const withConsistency = analyzedPacks.map((pack) => ({
    pack,
    cs: parseAuthorityConsistency(pack.authorityConsistency),
  }));

  const issues: WeaknessRadarIssue[] = [];

  // LOW_DIFFERENTIATION
  if (withMessaging.length > 0) {
    const affected = withMessaging
      .filter(({ ms }) => (ms?.differentiationClarity ?? 0) < 12)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.4) {
      issues.push(
        buildIssue(
          "LOW_DIFFERENTIATION",
          "Low Differentiation",
          affected,
          analyzed,
          "Clarify how your approach differs from typical alternatives in each claim.",
        ),
      );
    }
  }

  // WEAK_HOOKS
  if (withMessaging.length > 0) {
    const affected = withMessaging
      .filter(({ ms }) => (ms?.hookStrength ?? 0) < 12)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.4) {
      issues.push(
        buildIssue(
          "WEAK_HOOKS",
          "Weak Hooks",
          affected,
          analyzed,
          "Tighten hooks with concrete stakes or a numeric signal tied to the core thesis.",
        ),
      );
    }
  }

  // THESIS_DRIFT
  if (withConsistency.length > 0) {
    const affected = withConsistency
      .filter(({ cs }) => (cs?.thesisAlignment ?? 0) <= 10)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.3) {
      issues.push(
        buildIssue(
          "THESIS_DRIFT",
          "Thesis Drift",
          affected,
          analyzed,
          "Anchor claims to your workspace thesis keywords before drafting.",
        ),
      );
    }
  }

  // POSITIONING_DRIFT
  if (withConsistency.length > 0) {
    const affected = withConsistency
      .filter(({ cs }) => (cs?.positioningAlignment ?? 0) <= 8)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.3) {
      issues.push(
        buildIssue(
          "POSITIONING_DRIFT",
          "Positioning Drift",
          affected,
          analyzed,
          "Reinforce differentiation with positioning language from your profile.",
        ),
      );
    }
  }

  // TONE_MISMATCH
  if (withConsistency.length > 0) {
    const affected = withConsistency
      .filter(({ cs }) => (cs?.toneMatch ?? 0) <= 10)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.3) {
      issues.push(
        buildIssue(
          "TONE_MISMATCH",
          "Tone Mismatch",
          affected,
          analyzed,
          "Align hooks and claims with the tone signals in your Authority Profile.",
        ),
      );
    }
  }

  // REPETITION_RISK
  if (withConsistency.length > 0) {
    const affected = withConsistency
      .filter(({ cs }) => cs?.driftWarnings.some((w) => w.toLowerCase().includes("repetition risk")))
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.3) {
      issues.push(
        buildIssue(
          "REPETITION_RISK",
          "Repetition Risk",
          affected,
          analyzed,
          "Rotate claim themes and introduce fresh angles to avoid repetition.",
        ),
      );
    }
  }

  // EVIDENCE_SHALLOW (optional)
  if (withMessaging.length > 0) {
    const affected = withMessaging
      .filter(({ ms }) => (ms?.evidenceDepth ?? 0) < 12)
      .map(({ pack }) => pack);
    const rate = affected.length / analyzed;
    if (rate >= 0.4) {
      issues.push(
        buildIssue(
          "EVIDENCE_SHALLOW",
          "Shallow Evidence",
          affected,
          analyzed,
          "Add concrete metrics or examples to deepen evidence for each claim.",
        ),
      );
    }
  }

  const sorted = issues
    .filter((issue) => rateMeetsThreshold(issue.evidence.rate))
    .sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.evidence.rate - a.evidence.rate;
    });

  return {
    radar: { windowSize, generatedAt, issues: sorted },
    analyzed,
  };
}

export async function getWeaknessRadarForUser(userId: string): Promise<{ radar: WeaknessRadar; analyzed: number }> {
  const now = Date.now();
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > now) {
    return { radar: cached.radar, analyzed: cached.analyzed };
  }

  const where: Prisma.AuthorityPackWhereInput = { userId };
  const packs = await prisma.authorityPack.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: WINDOW_SIZE,
    select: {
      id: true,
      title: true,
      createdAt: true,
      strategicMap: true,
      messagingStrength: true,
      authorityConsistency: true,
    },
  });

  const result = computeWeaknessRadar(packs, WINDOW_SIZE);
  cache.set(userId, { expiresAt: now + CACHE_TTL_MS, radar: result.radar, analyzed: result.analyzed });
  return result;
}

export async function getWeaknessRadarForRequest(): Promise<{ radar: WeaknessRadar; analyzed: number; userId: string }> {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("unauthorized");
  }
  const result = await getWeaknessRadarForUser(userId);
  return { ...result, userId };
}
