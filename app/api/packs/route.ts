import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import {
  generateAuthorityPack,
  isPackGenerationError,
  validatePackCompleteness,
} from "@/lib/packGenerationService";
import {
  assertWithinPlanLimits,
  buildPlanLimitPayload,
  incrementPackUsage,
  PlanLimitError,
} from "@/lib/planGuard";
import { getUserPlan, type UserPlanInfo } from "@/lib/getUserPlan";
import { calculateMessagingStrength, calculateQualityScore } from "@/lib/calculateQualityScore";
import { calculateAuthorityConsistency } from "@/lib/authorityConsistency";
import type { StrategicAuthorityMap } from "@/ai/prompts";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { apiError } from "@/lib/apiError";
import { guardAsync } from "@/lib/runtimeGuard";
import { type InputType, VALID_INPUT_TYPES, type AngleType, VALID_ANGLES, type AuthorityProfileContext } from "@/ai/prompts";
import { getPlanConfig } from "@/lib/plans";
import { getCurrentUsagePeriod } from "@/lib/usagePeriod";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 200_000;
const MIN_TEXT_CHARS = 200;
const YOUTUBE_URL_REGEX =
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const isYouTubeUrl = (value: string): boolean =>
  YOUTUBE_URL_REGEX.test(value.trim());

type PackResponse = {
  id: string;
  title: string;
  originalInput: string;
  createdAt: string;
};

const serializePack = (pack: {
  id: string;
  title: string;
  originalInput: string;
  createdAt: Date;
}): PackResponse => ({
  id: pack.id,
  title: pack.title,
  originalInput: pack.originalInput,
  createdAt: pack.createdAt.toISOString(),
});

const normalizeQuota = (value: number) => (value === Infinity ? null : value);

const buildPlanLimits = (planInfo: UserPlanInfo) => {
  const config = getPlanConfig(planInfo.plan);
  return {
    maxRegenerationsPerPack: Number.isFinite(config.maxRegenerationsPerPack)
      ? config.maxRegenerationsPerPack
      : null,
    maxStoredPacks: Number.isFinite(config.maxStoredPacks)
      ? config.maxStoredPacks
      : null,
    repurposeAccess: config.repurposeAccess,
    qualityFixAccess: config.qualityFixAccess,
  };
};

const buildResponse = (
  packs: { id: string; title: string; originalInput: string; createdAt: Date }[],
  planInfo: UserPlanInfo
) => ({
  packs: packs.map(serializePack),
  generated: planInfo.used,
  remaining: normalizeQuota(planInfo.remaining),
  plan: planInfo.plan,
  monthlyLimit: normalizeQuota(planInfo.limit),
  planLimits: buildPlanLimits(planInfo),
});

const loadUserPacks = async (userId: string) =>
  prisma.authorityPack.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

export async function GET() {
  try {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const [packs, planInfo] = await Promise.all([
      loadUserPacks(userId),
      getUserPlan(userId, { role: session.user.role }),
    ]);

    return NextResponse.json(buildResponse(packs, planInfo));
  } catch (err) {
    console.error("GET /api/packs error:", err);
    return NextResponse.json(
      {
        error: "server_error",
        packs: [],
        generated: 0,
        remaining: 3,
        plan: "FREE",
        monthlyLimit: 3,
        planLimits: {
          maxRegenerationsPerPack: 3,
          maxStoredPacks: null,
          repurposeAccess: false,
          qualityFixAccess: false,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return guardAsync(async () => {
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return apiError("unauthorized", "UNAUTHORIZED", 401);
    }

    const requestStartedAt = Date.now();
    const logStage = (event: string) =>
      logger.info(event, { userId, elapsedMs: Date.now() - requestStartedAt });

    logger.info("generation.request_received", { userId });

    // Rate limit: 10 generation requests per minute per user
    if (!rateLimit(`gen:${userId}`, 10, 60_000)) {
      logger.warn("pack.generation.rate_limited", { userId });
      return apiError("rate_limited", "RATE_LIMITED", 429, {
        message: "Too many requests - please wait a moment before generating another pack.",
      });
    }

    const existingPacks = await loadUserPacks(userId);

    const withPlanInfo = async (extra?: Record<string, unknown>) => {
      const planInfo = await getUserPlan(userId, { role: session.user.role });
      return { ...buildResponse(existingPacks, planInfo), ...(extra ?? {}) };
    };

    // Check plan limit before doing any expensive work
    let planSnapshot: Awaited<ReturnType<typeof assertWithinPlanLimits>> | null = null;
    try {
      planSnapshot = await assertWithinPlanLimits({
        userId,
        action: "create_pack",
        userRole: session.user.role,
        packCount: existingPacks.length,
      });
    } catch (err) {
      if (err instanceof PlanLimitError) {
        logger.info("pack.generation.limit_reached", { userId, plan: err.plan, limit: err.limit });
        return NextResponse.json(
          {
            ...buildPlanLimitPayload(err),
            ...(await withPlanInfo()),
          },
          { status: 403 },
        );
      }
      throw err;
    }
    if (!planSnapshot) {
      return apiError(
        "generation_failed",
        "INTERNAL_ERROR",
        500,
        await withPlanInfo({ detail: "Plan check failed." }),
      );
    }

    const [authorityProfile, recentSAMs] = await Promise.all([
      prisma.authorityProfile.findUnique({ where: { userId } }),
      prisma.authorityPack.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { strategicMap: true },
      }),
    ]);
    const profile: AuthorityProfileContext | null = authorityProfile
      ? {
          coreThesis: authorityProfile.coreThesis,
          positioning: authorityProfile.positioning,
          targetAudience: authorityProfile.targetAudience,
          tone: authorityProfile.tone,
          toneNotes: authorityProfile.toneNotes,
        }
      : null;
    let input = "";
    let titleFromUser = "";
    let inputType: InputType = "INTERVIEW";
    let angle: AngleType = "THOUGHT_LEADERSHIP";
    try {
      const body = (await request.json()) as { input?: string; title?: string; inputType?: string; angle?: string };
      input = typeof body.input === "string" ? body.input.trim() : "";
      titleFromUser = typeof body.title === "string" ? body.title.trim() : "";
      const rawType = typeof body.inputType === "string" ? body.inputType.trim() : "";
      inputType = VALID_INPUT_TYPES.has(rawType as InputType)
        ? (rawType as InputType)
        : "INTERVIEW";
      const rawAngle = typeof body.angle === "string" ? body.angle.trim() : "";
      angle = VALID_ANGLES.has(rawAngle as AngleType)
        ? (rawAngle as AngleType)
        : "THOUGHT_LEADERSHIP";
    } catch {
      input = "";
    }

    if (!input) {
      logger.warn("generation.aborted", { userId, code: "INVALID_INPUT" });
      return apiError("INVALID_INPUT", "INVALID_INPUT", 400, await withPlanInfo());
    }

    if (input.length > MAX_INPUT_CHARS) {
      logger.warn("generation.aborted", { userId, code: "INPUT_TOO_LARGE", length: input.length });
      return apiError(
        "INVALID_INPUT",
        "INPUT_TOO_LARGE",
        413,
        await withPlanInfo({ detail: "Input exceeds the maximum allowed length." }),
      );
    }

    const isUrl = /^https?:\/\//i.test(input);
    if (isUrl && !isYouTubeUrl(input)) {
      logger.warn("generation.aborted", { userId, code: "INPUT_INVALID_URL" });
      return apiError(
        "INVALID_INPUT",
        "INPUT_INVALID_URL",
        400,
        await withPlanInfo({ detail: "Invalid YouTube URL." }),
      );
    }

    // Reject suspiciously short non-URL input
    if (!isUrl && input.length < MIN_TEXT_CHARS) {
      logger.warn("generation.aborted", { userId, code: "INVALID_INPUT" });
      return apiError(
        "INVALID_INPUT",
        "INVALID_INPUT",
        400,
        await withPlanInfo({
          detail: "Please provide a YouTube URL or at least 200 characters of text.",
        }),
      );
    }

    logger.info("pack.generation.started", { userId, inputLength: input.length, isUrl, inputType, angle });

    let structuredPack: Awaited<ReturnType<typeof generateAuthorityPack>>;
    try {
      structuredPack = await generateAuthorityPack(input, {
        onStage: (stage) => {
          logStage(`generation.${stage}`);
        },
        inputType,
        angle,
        profile,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      if (isPackGenerationError(err)) {
        const code = err.code;
        if (code === "TRANSCRIPT_UNAVAILABLE") {
          logger.warn("generation.aborted", { userId, code, detail });
          return apiError(
            "transcript_unavailable",
            code,
            422,
            await withPlanInfo({ detail }),
          );
        }
        if (code === "INPUT_INVALID_URL") {
          logger.warn("generation.aborted", { userId, code, detail });
          return apiError("INVALID_INPUT", code, 400, await withPlanInfo({ detail }));
        }
        if (code === "EXTRACTION_PARSE_FAILED") {
          logger.error("generation.aborted", { userId, code, detail });
          return apiError("generation_failed", code, 502, await withPlanInfo({ detail }));
        }
        if (code === "ASSET_GEN_FAILED" || code === "PACK_INCOMPLETE") {
          logger.error("generation.aborted", { userId, code, detail });
          return apiError("generation_failed", code, 500, await withPlanInfo({ detail }));
        }
      }

      logger.error("generation.aborted", { userId, code: "INTERNAL_ERROR", detail });
      return apiError("generation_failed", "INTERNAL_ERROR", 500, await withPlanInfo({ detail }));
    }

    const fallbackTitle = structuredPack.title || `Authority Pack #${existingPacks.length + 1}`;
    const finalTitle = titleFromUser || fallbackTitle;

    logStage("generation.scoring_started");
    let totalScore: number;
    let breakdown: ReturnType<typeof calculateQualityScore>["breakdown"];
    const messagingStrength = calculateMessagingStrength(structuredPack.strategicMap ?? null);
    const recentStrategicMaps = recentSAMs
      .map((row) => row.strategicMap)
      .filter((sam): sam is StrategicAuthorityMap => Boolean(sam));
    const authorityConsistency = calculateAuthorityConsistency(
      profile,
      structuredPack.strategicMap ?? null,
      recentStrategicMaps,
    );
    try {
      const scored = calculateQualityScore(
        structuredPack,
        inputType,
        angle,
        profile?.coreThesis ?? undefined,
        structuredPack.strategicMap ?? null,
      );
      totalScore = scored.totalScore;
      breakdown = scored.breakdown;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.error("generation.aborted", { userId, code: "PACK_INCOMPLETE", detail });
      return apiError(
        "generation_failed",
        "PACK_INCOMPLETE",
        500,
        await withPlanInfo({ detail: "Quality scoring failed." }),
      );
    }

    const completeness = validatePackCompleteness(structuredPack, totalScore, breakdown);
    if (!completeness.ok) {
      logger.error("generation.aborted", {
        userId,
        code: "PACK_INCOMPLETE",
        reason: completeness.reason,
      });
      return apiError(
        "generation_failed",
        "PACK_INCOMPLETE",
        500,
        await withPlanInfo({ detail: completeness.reason }),
      );
    }

    let created;
    try {
      created = await prisma.$transaction(async (tx) => {
        const { month, year } = getCurrentUsagePeriod();
        const usage = await tx.usage.findUnique({
          where: { userId_month_year: { userId, month, year } },
        });
        const used = usage?.packsUsed ?? 0;
        const limit = planSnapshot.config.monthlyPackLimit;

        if (Number.isFinite(limit) && used >= limit) {
          throw new PlanLimitError({
            code: "PLAN_LIMIT_PACKS_EXCEEDED",
            plan: planSnapshot.plan,
            action: "create_pack",
            limit,
            used,
            message: `You've reached your ${planSnapshot.plan} plan limit of ${limit} packs per month (${used}/${limit}).`,
          });
        }

        if (Number.isFinite(planSnapshot.config.maxStoredPacks)) {
          const packCount = await tx.authorityPack.count({ where: { userId } });
          if (packCount >= planSnapshot.config.maxStoredPacks) {
            throw new PlanLimitError({
              code: "PLAN_LIMIT_PACKS_EXCEEDED",
              plan: planSnapshot.plan,
              action: "create_pack",
              limit: planSnapshot.config.maxStoredPacks,
              used: packCount,
              message: `You've reached your ${planSnapshot.plan} plan storage limit (${packCount}/${planSnapshot.config.maxStoredPacks} packs).`,
            });
          }
        }

        const createdPack = await tx.authorityPack.create({
          data: {
            title: finalTitle,
            originalInput: input,
            userId,
            inputType,
            angle,
            coreThesis: structuredPack.coreThesis,
            strategicHooks: structuredPack.strategicHooks,
            highLeveragePosts: structuredPack.highLeveragePosts,
            insightBreakdown: structuredPack.insightBreakdown,
            repurposingMatrix: structuredPack.repurposingMatrix,
            executiveSummary: structuredPack.executiveSummary,
            strategicMap: structuredPack.strategicMap ?? Prisma.JsonNull,
            messagingStrength: messagingStrength ?? Prisma.JsonNull,
            authorityConsistency: authorityConsistency ?? Prisma.JsonNull,
            qualityScore: totalScore,
            qualityBreakdown: breakdown,
            lastGeneratedAt: new Date(),
          },
        });

        await incrementPackUsage(userId, tx);
        return createdPack;
      });
    } catch (err) {
      if (err instanceof PlanLimitError) {
        logger.info("pack.generation.limit_reached", { userId, plan: err.plan, limit: err.limit });
        return NextResponse.json(
          {
            ...buildPlanLimitPayload(err),
            ...(await withPlanInfo()),
          },
          { status: 403 },
        );
      }
      const detail = err instanceof Error ? err.message : String(err);
      logger.error("generation.aborted", { userId, code: "INTERNAL_ERROR", detail });
      return apiError("generation_failed", "INTERNAL_ERROR", 500, await withPlanInfo({ detail }));
    }
    logger.info("generation.persisted", { userId, packId: created.id, qualityScore: totalScore });
    logStage("generation.completed");

    const [packs, planInfo] = await Promise.all([
      loadUserPacks(userId),
      getUserPlan(userId, { role: session.user.role }),
    ]);

    return NextResponse.json({
      ...buildResponse(packs, planInfo),
      lastCreatedId: created.id,
    });
  }, "packs.post");
}
