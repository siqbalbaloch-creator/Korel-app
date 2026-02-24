import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import {
  extractSAM,
  regenerateLinkedInFromSAM,
  regenerateXThreadFromSAM,
  deriveHooksFromSAM,
  isPackGenerationError,
} from "@/lib/packGenerationService";
import { calculateMessagingStrength, calculateQualityScore } from "@/lib/calculateQualityScore";
import { calculateAuthorityConsistency } from "@/lib/authorityConsistency";
import {
  type InputType,
  VALID_INPUT_TYPES,
  type AngleType,
  VALID_ANGLES,
  type AuthorityProfileContext,
  type StrategicAuthorityMap,
} from "@/ai/prompts";
import { buildInsightTopicIndex, validateAssetContent } from "@/lib/insightGuard";
import { apiError } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { acquireLock, releaseLock } from "@/lib/rateLimit";
import { guardAsync } from "@/lib/runtimeGuard";
import { assertWithinPlanLimits, buildPlanLimitPayload, PlanLimitError } from "@/lib/planGuard";

export const runtime = "nodejs";

type RegenerateBody = {
  section: "linkedin_variant" | "xthread" | "hooks";
  variantIndex?: number;
};

const toJsonObject = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const buildGuardIndexFromSAM = (sam: StrategicAuthorityMap) => {
  const derivedHooks = deriveHooksFromSAM(sam);
  return buildInsightTopicIndex({
    coreThesis: {
      primaryThesis: sam.coreThesis.statement,
      supportingThemes: sam.strategicClaims.map((c) => c.claim),
      targetPersona: sam.coreThesis.audience,
    },
    insightBreakdown: {
      strongClaims: sam.strategicClaims.map((c) => c.claim),
      dataBackedAngles: [
        ...sam.proofAssets.metrics,
        ...sam.proofAssets.comparisons,
      ].filter(Boolean),
      frameworks: sam.strategicClaims.map((c) => `${c.id}: ${c.whyItMatters}`),
    },
    executiveSummary: {
      headline: sam.coreThesis.statement,
      positioningSentence: sam.narrativeArc.takeaway,
      keyInsights: [
        ...sam.strategicClaims.map((c) => c.claim),
        ...sam.objections,
      ].slice(0, 5),
    },
    strategicHooks: derivedHooks,
  });
};

const rejectUnsupported = (
  section: string,
  unsupported: string[],
  meta: { userId: string; packId: string },
) => {
  console.warn(`[pack-regenerate] Unsupported claims in ${section}:`, unsupported);
  logger.error("regen.failed", {
    userId: meta.userId,
    packId: meta.packId,
    code: "INSIGHT_GUARD_BLOCKED",
    section,
  });
  return apiError("Regeneration blocked", "INSIGHT_GUARD_BLOCKED", 422);
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return guardAsync(async () => {
    const { id } = await params;
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const pack = await prisma.authorityPack.findFirst({
      where: { id, userId },
    });

    if (!pack) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Enforce regeneration limits before any model call
    try {
      await assertWithinPlanLimits({
        userId,
        action: "regenerate",
        userRole: session.user.role,
        packRegenerationCount: pack.regenerationCount ?? 0,
      });
    } catch (err) {
      if (err instanceof PlanLimitError) {
        logger.info("regen.limit_reached", { userId, packId: id, plan: err.plan, limit: err.limit });
        return NextResponse.json(buildPlanLimitPayload(err), { status: 403 });
      }
      throw err;
    }

    // Preserve inputType and angle from stored pack — both are immutable per pack
    const packInputType: InputType = VALID_INPUT_TYPES.has(pack.inputType as InputType)
      ? (pack.inputType as InputType)
      : "INTERVIEW";
    const packAngle: AngleType = VALID_ANGLES.has(pack.angle as AngleType)
      ? (pack.angle as AngleType)
      : "THOUGHT_LEADERSHIP";

    // Fetch current authority profile for workspace memory injection
    const [authorityProfile, recentSAMs] = await Promise.all([
      prisma.authorityProfile.findUnique({ where: { userId } }),
      prisma.authorityPack.findMany({
        where: { userId, id: { not: id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { strategicMap: true },
      }),
    ]);
    const packProfile: AuthorityProfileContext | null = authorityProfile
      ? {
          coreThesis: authorityProfile.coreThesis,
          positioning: authorityProfile.positioning,
          targetAudience: authorityProfile.targetAudience,
          tone: authorityProfile.tone,
          toneNotes: authorityProfile.toneNotes,
        }
      : null;

    const lockKey = `regen:${userId}:${id}`;
    if (!acquireLock(lockKey, 30_000)) {
      logger.warn("regen.locked", { userId, packId: id });
      return apiError("regeneration_in_progress", "REGEN_IN_PROGRESS", 409);
    }

    const requestStartedAt = Date.now();
    logger.info("regen.request_received", { userId, packId: id });

    try {
      const rawBody = await request.json();
      const body = rawBody as RegenerateBody;
      const bodyKeys = Object.keys(toJsonObject(rawBody));
      const allowedKeys = new Set(["section", "variantIndex"]);
      const forbiddenInsightKeys = new Set([
        "coreThesis",
        "insightBreakdown",
        "strategicHooks",
        "executiveSummary",
        "highLeveragePosts",
        "primaryThesis",
        "supportingThemes",
        "contrarianAngle",
        "keyPoints",
        "notableStatsOrClaims",
        "insights",
      ]);
      const hasForbidden = bodyKeys.some((key) => forbiddenInsightKeys.has(key));
      const hasUnknown = bodyKeys.some((key) => !allowedKeys.has(key));
      if (hasForbidden || hasUnknown) {
        logger.debug("regen.guard_rejected", { id, keys: bodyKeys });
        logger.error("regen.failed", { userId, packId: id, code: "INTERNAL_INVALID_REGEN" });
        return apiError("Invalid regeneration payload", "INTERNAL_INVALID_REGEN", 400);
      }

      logger.info("regen.section_started", { userId, packId: id, section: body.section });
      logger.info("regen.map_started", { userId, packId: id, section: body.section });

      let sam: StrategicAuthorityMap;
      try {
        sam = await extractSAM(pack.originalInput, packInputType, packAngle, packProfile);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        if (isPackGenerationError(err)) {
          const code = err.code;
          if (code === "TRANSCRIPT_UNAVAILABLE") {
            logger.warn("regen.failed", { userId, packId: id, code, detail });
            return apiError("transcript_unavailable", code, 422, { detail });
          }
          if (code === "INPUT_INVALID_URL") {
            logger.warn("regen.failed", { userId, packId: id, code, detail });
            return apiError("INVALID_INPUT", code, 400, { detail });
          }
          if (code === "EXTRACTION_PARSE_FAILED") {
            logger.error("regen.failed", { userId, packId: id, code, detail });
            return apiError("generation_failed", code, 502, { detail });
          }
        }
        logger.error("regen.failed", { userId, packId: id, code: "INTERNAL_ERROR", detail });
        return apiError("generation_failed", "INTERNAL_ERROR", 500, { detail });
      }

      logger.info("regen.map_completed", { userId, packId: id, section: body.section });
      logger.info("regen.assets_started", { userId, packId: id, section: body.section });

      const guardIndex = buildGuardIndexFromSAM(sam);
      const messagingStrength = calculateMessagingStrength(sam);
      const authorityConsistency = calculateAuthorityConsistency(
        packProfile,
        sam,
        recentSAMs
          .map((row) => row.strategicMap)
          .filter((map): map is StrategicAuthorityMap => Boolean(map)),
      );

      if (body.section === "linkedin_variant") {
        const idx = (body.variantIndex ?? 0) as 0 | 1 | 2;
        const existing = toJsonObject(pack.highLeveragePosts);
        const currentPosts = toStringArray(existing.linkedinPosts).slice(0, 3);
        while (currentPosts.length < 3) currentPosts.push("");
        const existingPost = currentPosts[idx] ?? "";
        const { post, error } = await regenerateLinkedInFromSAM(
          sam,
          idx,
          packInputType,
          packAngle,
          packProfile,
          existingPost || undefined,
        );

        if (error || !post || typeof post !== "string" || !post.trim()) {
          logger.error("regen.failed", { userId, packId: id, code: "ASSET_GEN_FAILED" });
          return apiError("generation_failed", "ASSET_GEN_FAILED", 500, { detail: error });
        }

        if (guardIndex.topics.length || guardIndex.keywords.length) {
          const guardResult = validateAssetContent(post, guardIndex);
          if (!guardResult.ok) {
            return rejectUnsupported("linkedin_variant", guardResult.unsupported, {
              userId,
              packId: id,
            });
          }
        }

        currentPosts[idx] = post;
        const nextHighLeveragePosts = { ...existing, linkedinPosts: currentPosts };
        const { totalScore: qualityScore, breakdown: qualityBreakdown } = calculateQualityScore(
          {
            ...pack,
            highLeveragePosts: nextHighLeveragePosts,
          },
          packInputType,
          packAngle,
          packProfile?.coreThesis ?? undefined,
          sam,
        );

        await prisma.authorityPack.update({
          where: { id },
          data: {
            highLeveragePosts: nextHighLeveragePosts,
            strategicMap: sam,
            messagingStrength,
            authorityConsistency,
            regenerationCount: { increment: 1 },
            lastGeneratedAt: new Date(),
            qualityScore,
            qualityBreakdown,
          },
        });

        logger.info("regen.assets_completed", { userId, packId: id, section: "linkedin_variant" });
        logger.info("regen.succeeded", { userId, packId: id, section: "linkedin_variant", variantIndex: idx });
        return NextResponse.json({ variantIndex: idx, post, qualityScore, qualityBreakdown });
      }

      if (body.section === "xthread") {
        const existing = toJsonObject(pack.highLeveragePosts);
        const existingThread = Array.isArray(existing.twitterThread)
          ? (existing.twitterThread as string[]).join("\n")
          : "";
        const { thread, error } = await regenerateXThreadFromSAM(
          sam,
          packInputType,
          packAngle,
          packProfile,
          existingThread || undefined,
        );

        if (
          error ||
          !Array.isArray(thread) ||
          thread.length === 0 ||
          !thread.every((item) => typeof item === "string" && item.trim())
        ) {
          logger.error("regen.failed", { userId, packId: id, code: "ASSET_GEN_FAILED" });
          return apiError("generation_failed", "ASSET_GEN_FAILED", 500, { detail: error });
        }

        if (guardIndex.topics.length || guardIndex.keywords.length) {
          const guardResult = validateAssetContent(thread.join("\n"), guardIndex);
          if (!guardResult.ok) {
            return rejectUnsupported("xthread", guardResult.unsupported, {
              userId,
              packId: id,
            });
          }
        }

        const nextHighLeveragePosts = { ...existing, twitterThread: thread };
        const { totalScore: qualityScore, breakdown: qualityBreakdown } = calculateQualityScore(
          {
            ...pack,
            highLeveragePosts: nextHighLeveragePosts,
          },
          packInputType,
          packAngle,
          packProfile?.coreThesis ?? undefined,
          sam,
        );

        await prisma.authorityPack.update({
          where: { id },
          data: {
            highLeveragePosts: nextHighLeveragePosts,
            strategicMap: sam,
            messagingStrength,
            authorityConsistency,
            regenerationCount: { increment: 1 },
            lastGeneratedAt: new Date(),
            qualityScore,
            qualityBreakdown,
          },
        });

        logger.info("regen.assets_completed", { userId, packId: id, section: "xthread" });
        logger.info("regen.succeeded", { userId, packId: id, section: "xthread" });
        return NextResponse.json({ thread, qualityScore, qualityBreakdown });
      }

      if (body.section === "hooks") {
        const hooks = deriveHooksFromSAM(sam);

        const hooksValid =
          hooks &&
          Array.isArray(hooks.linkedin) &&
          Array.isArray(hooks.twitter) &&
          Array.isArray(hooks.contrarian) &&
          hooks.linkedin.every((item) => typeof item === "string" && item.trim()) &&
          hooks.twitter.every((item) => typeof item === "string" && item.trim()) &&
          hooks.contrarian.every((item) => typeof item === "string" && item.trim());

        if (!hooksValid) {
          logger.error("regen.failed", { userId, packId: id, code: "ASSET_GEN_FAILED" });
          return apiError("generation_failed", "ASSET_GEN_FAILED", 500);
        }

        const { totalScore: qualityScore, breakdown: qualityBreakdown } = calculateQualityScore(
          {
            ...pack,
            strategicHooks: hooks,
          },
          packInputType,
          packAngle,
          packProfile?.coreThesis ?? undefined,
          sam,
        );

        await prisma.authorityPack.update({
          where: { id },
          data: {
            strategicHooks: hooks,
            strategicMap: sam,
            messagingStrength,
            authorityConsistency,
            regenerationCount: { increment: 1 },
            lastGeneratedAt: new Date(),
            qualityScore,
            qualityBreakdown,
          },
        });

        logger.info("regen.assets_completed", { userId, packId: id, section: "hooks" });
        logger.info("regen.succeeded", { userId, packId: id, section: "hooks" });
        return NextResponse.json({ hooks, qualityScore, qualityBreakdown });
      }

      logger.error("regen.failed", { userId, packId: id, code: "INVALID_SECTION" });
      return apiError("invalid_section", "INVALID_INPUT", 400);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.error("regen.failed", { userId, packId: id, code: "INTERNAL_ERROR", detail });
      return apiError("generation_failed", "INTERNAL_ERROR", 500, { detail });
    } finally {
      const durationMs = Date.now() - requestStartedAt;
      logger.info("regen.completed", { userId, packId: id, durationMs });
      logger.info("regen.duration_ms", { userId, packId: id, durationMs });
      releaseLock(lockKey);
    }
  }, "packs.regenerate");
}
