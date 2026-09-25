import { prisma } from '../config/prisma.js';
import { ReputationTier as PrismaReputationTier } from '@prisma/client';

/**
 * Trust score service — Phase 4 W4.
 *
 * Computes a 0-100 reputation score for recruiters based on placement
 * outcomes. The score is broken into three components:
 *   - Success rate (60%): successfulPlacements / totalPlacements
 *   - Volume bonus (20%): min(totalPlacements, 50) * 0.4
 *   - Streak bonus (10%): +10 if the last 3 terminal placements are all 'joined'
 *
 * Tier mapping: 0-24 bronze, 25-49 silver, 50-74 gold, 75-100 platinum.
 */

// Terminal statuses that count as a "placement" (decision was made).
const PLACEMENT_STATUSES = ['hired', 'joined', 'rejected', 'withdrawn'] as const;

function mapTier(score: number): PrismaReputationTier {
  if (score >= 75) return PrismaReputationTier.platinum;
  if (score >= 50) return PrismaReputationTier.gold;
  if (score >= 25) return PrismaReputationTier.silver;
  return PrismaReputationTier.bronze;
}

export async function recalculateTrustScore(recruiterId: string): Promise<void> {
  // Successful placements = submissions that reached 'joined'.
  const successfulPlacements = await prisma.submission.count({
    where: { recruiterId, status: 'joined' },
  });

  // Total placements = submissions in any terminal/decision state.
  const totalPlacements = await prisma.submission.count({
    where: { recruiterId, status: { in: [...PLACEMENT_STATUSES] } },
  });

  // Base: success rate contributes up to 60 points.
  const base = (successfulPlacements / Math.max(totalPlacements, 1)) * 60;

  // Volume bonus: up to 20 points (50 placements → max).
  const volume = Math.min(totalPlacements, 50) * 0.4;

  // Streak: if last 3 terminal submissions are all 'joined', add 10 points.
  let streak = 0;
  if (totalPlacements >= 3) {
    const lastThree = await prisma.submission.findMany({
      where: { recruiterId, status: { in: [...PLACEMENT_STATUSES] } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { status: true },
    });
    if (lastThree.length === 3 && lastThree.every((s) => s.status === 'joined')) {
      streak = 10;
    }
  }

  const score = Math.min(Math.round(base + volume + streak), 100);
  const tier = mapTier(score);

  await prisma.recruiterProfile.update({
    where: { id: recruiterId },
    data: {
      reputationScore: score,
      reputationTier: tier,
      totalPlacements,
      successfulPlacements,
    },
  });
}

export async function getTrustScore(recruiterId: string): Promise<{
  reputationScore: number;
  reputationTier: string;
  totalPlacements: number;
  successfulPlacements: number;
}> {
  const profile = await prisma.recruiterProfile.findUnique({
    where: { id: recruiterId },
    select: {
      reputationScore: true,
      reputationTier: true,
      totalPlacements: true,
      successfulPlacements: true,
    },
  });
  if (!profile) {
    throw new Error('Recruiter profile not found');
  }
  return {
    reputationScore: profile.reputationScore,
    reputationTier: profile.reputationTier,
    totalPlacements: profile.totalPlacements,
    successfulPlacements: profile.successfulPlacements,
  };
}
