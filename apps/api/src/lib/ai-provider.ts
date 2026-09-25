import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

// ── Types ────────────────────────────────────────────────────

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionParams {
  messages: AiMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** For token tracking — what operation triggered this call */
  operation: string;
  /** Optional reference to the entity being processed */
  referenceType?: string;
  referenceId?: string;
}

export interface AiCompletionResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  latencyMs: number;
}

// ── Cost table (USD per 1K tokens) ──────────────────────────

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
  'gpt-4.1': { input: 0.002, output: 0.008 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_1K[model] ?? { input: 0.001, output: 0.002 };
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

// ── Provider implementations ─────────────────────────────────

async function openaiComplete(params: AiCompletionParams): Promise<AiCompletionResult> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const model = params.model ?? env.AI_MODEL;
  const start = Date.now();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: params.messages,
      max_tokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as any;
  const latencyMs = Date.now() - start;
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content ?? '',
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    totalTokens: data.usage?.total_tokens ?? 0,
    model,
    latencyMs,
  };
}

// ── Public API ───────────────────────────────────────────────

const providers: Record<string, (params: AiCompletionParams) => Promise<AiCompletionResult>> = {
  openai: openaiComplete,
};

/** Whether an LLM provider is configured and ready to use. */
export function isAiAvailable(): boolean {
  if (env.AI_PROVIDER === 'openai') return !!env.OPENAI_API_KEY;
  return false;
}

/**
 * Run an LLM completion with automatic token tracking.
 * Uses the configured provider (default: OpenAI).
 */
export async function aiComplete(params: AiCompletionParams): Promise<AiCompletionResult> {
  const provider = env.AI_PROVIDER;
  const fn = providers[provider];
  if (!fn) throw new Error(`Unknown AI provider: ${provider}`);

  const result = await fn(params);

  // Log usage asynchronously — never block the caller
  const costUsd = estimateCost(result.model, result.inputTokens, result.outputTokens);
  void prisma.aiUsageLog
    .create({
      data: {
        provider,
        model: result.model,
        operation: params.operation,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        costUsd,
        latencyMs: result.latencyMs,
        referenceType: params.referenceType ?? null,
        referenceId: params.referenceId ?? null,
      },
    })
    .catch((err) => {
      console.error('[ai-provider] Failed to log usage:', err.message);
    });

  return result;
}

/**
 * Get aggregated AI usage stats for the admin dashboard.
 */
export async function getAiUsageStats(startDate?: Date, endDate?: Date) {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [aggregate, byOperation, byProvider, recentLogs] = await Promise.all([
    prisma.aiUsageLog.aggregate({
      where,
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
      _count: true,
      _avg: { latencyMs: true },
    }),
    prisma.aiUsageLog.groupBy({
      by: ['operation'],
      where,
      _sum: { totalTokens: true, costUsd: true },
      _count: true,
    }),
    prisma.aiUsageLog.groupBy({
      by: ['provider', 'model'],
      where,
      _sum: { totalTokens: true, costUsd: true },
      _count: true,
    }),
    prisma.aiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    totals: {
      calls: aggregate._count,
      inputTokens: aggregate._sum.inputTokens ?? 0,
      outputTokens: aggregate._sum.outputTokens ?? 0,
      totalTokens: aggregate._sum.totalTokens ?? 0,
      costUsd: (aggregate._sum.costUsd ?? 0).toString(),
      avgLatencyMs: Math.round(aggregate._avg.latencyMs ?? 0),
    },
    byOperation: byOperation.map((o) => ({
      operation: o.operation,
      calls: o._count,
      totalTokens: o._sum.totalTokens ?? 0,
      costUsd: (o._sum.costUsd ?? 0).toString(),
    })),
    byProvider: byProvider.map((p) => ({
      provider: p.provider,
      model: p.model,
      calls: p._count,
      totalTokens: p._sum.totalTokens ?? 0,
      costUsd: (p._sum.costUsd ?? 0).toString(),
    })),
    recentLogs: recentLogs.map((l) => ({
      id: l.id,
      provider: l.provider,
      model: l.model,
      operation: l.operation,
      totalTokens: l.totalTokens,
      costUsd: l.costUsd.toString(),
      latencyMs: l.latencyMs,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
