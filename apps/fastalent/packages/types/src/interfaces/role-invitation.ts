/** Single role invitation response. */
export interface RoleInvitationResponse {
  id: string;
  roleId: string;
  recruiterProfileId: string;
  invitedByUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  respondedAt: string | null;
  createdAt: string;

  /** Populated in list views. */
  recruiter?: {
    id: string;
    fullName: string;
    specializations: string[];
    reputationTier: string;
    reputationScore: number;
  };
  role?: {
    id: string;
    title: string;
  };
}

/** Input for creating a role invitation. */
export interface CreateRoleInvitationInput {
  recruiterProfileId: string;
  message?: string;
}
