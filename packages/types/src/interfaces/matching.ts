/**
 * Matching AI types — Phase 16.
 */

export type JdCruxStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JdCruxResponse {
  id: string;
  roleId: string;
  status: JdCruxStatus;
  keySkills: string[];
  niceToHaveSkills: string[];
  mustHaves: string[];
  qualifications: string[];
  seniorityLevel: string | null;
  experienceMin: number | null;
  experienceMax: number | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchCheckInput {
  cvS3Key: string;
  cvMimeType: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
}

export interface MatchBreakdown {
  skills: number;
  experience: number;
  qualifications: number;
}

export interface MatchResult {
  score: number;
  breakdown: MatchBreakdown;
  missingSkills: string[];
  missingQualifications: string[];
  explanation: string;
  piiRedactionCount: number;
}

export interface BiasAuditInput {
  roleId: string;
  cvS3Key: string;
  cvMimeType: string;
}

export interface BiasAuditResult {
  passed: boolean;
  maxDisparity: number;
  results: Array<{
    nameVariation: string;
    score: number;
    disparity: number;
  }>;
}
