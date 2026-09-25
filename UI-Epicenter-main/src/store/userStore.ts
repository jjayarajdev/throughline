// stores/userStore.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface Role {
  id: number
  name: string
}

interface UserState {
  token: string | null
  roles: Role[]
  userId: number | null
  userName: string
  email: string
  partnerId: string | null
  partnerName?: string  // Optional field for partner name
  setUser: (data: {
    token: string
    roles: Role[]
    userId: number
    userName: string
    email: string
    partnerId: string | null
    partnerName?: string // Optional field for partner name
  }) => void
  clearUser: () => void
}

export const useUserStore = create(
  persist<UserState>(
    (set) => ({
      token: null,
      roles: [],
      userId: null,
      userName: '',
      email: '',
      partnerId: null,
      partnerName: "", // Initialize partnerName as null
      setUser: (data) =>
        set({
          token: data.token,
          roles: data.roles,
          userId: data.userId,
          userName: data.userName,
          email: data.email,
          partnerId: data.partnerId,
          partnerName: data.partnerName ? data.partnerName : "", // 
        }),
      clearUser: () =>
        set({
          token: null,
          roles: [],
          userId: null,
          userName: '',
          email: '',
          partnerId: null,
          partnerName: "", // Clear partnerName
        }),
    }),
    {
      name: 'hp-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

export const roles = useUserStore.getState().roles;
export const isPartner = roles.some(role => role.name === 'PARTNER')
export const isAdmin = roles.some(role => role.name === 'ADMIN')
export const isVendorManager = roles.some(role => role.name === 'Vendor Manager')
export const isHiringManager = roles.some(role => role.name === 'Hiring Manager')
export const isPanel = roles.some(role => role.name === 'PANEL')
export const isBetApprover = roles.some(role => role.name === 'BET Approver')
export const isBetMember = roles.some(role => role.name === 'BET Member')
export const isDomainManager = roles.some(role => role.name === 'Domain Manager')
export const isRmowner = roles.some(role => role.name === 'RM Owner')
export const isHiringTeam = roles.some(role => role.name === 'HIRINGTEAM')
export const isHiringSpoc = roles.some(role => role.name === 'Onboarding SPOC')


export const isHiringCreate =  isAdmin || isBetApprover || isBetMember
export const isHiringEdit =  isAdmin || isRmowner  || isVendorManager 
export const isAllhrqidReviewRequest =  isAdmin  || isHiringManager || isDomainManager || isBetApprover
export const isHiringAccept = isAdmin || isRmowner
export const isShowslotAllocation = isAdmin || isRmowner ||isVendorManager
