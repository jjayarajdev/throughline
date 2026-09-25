import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PartnerState {
    partnerCode: string;
    partnerId: string;
     contactMatrixId: string;
    partnerStatus: boolean;
    isPartnerEmpanelled: boolean;
    setPartnerCode: (code: string) => void;
    setPartnerId: (id: string) => void;
    setContactMatriId:(id:string)=>void;
    setPartnerStatus: (status: boolean) => void;
    setIsPartnerEmpanelled: (status: boolean) => void;
}

export const usePartnerStore = create<PartnerState>()(
    persist(
        (set) => ({
            partnerCode: 'PID***',
            partnerId: '',
             contactMatrixId:"",
            partnerStatus: false,
            isPartnerEmpanelled: false,
            setPartnerCode: (code) => set({ partnerCode: code }),
            setPartnerId: (id) => set({ partnerId: id }),
            setContactMatriId:(id)=>set({contactMatrixId:id}),
            setPartnerStatus: (status) => set({ partnerStatus: status }),
            setIsPartnerEmpanelled: (status) => set({ isPartnerEmpanelled: status })
        }),
        {
            name: 'partner-storage', // unique name for localStorage key
        }
    )
);
