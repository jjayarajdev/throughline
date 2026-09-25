'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { onboarding } from '@/services/api/onboarding.api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Building,
  FileCheck,
  Calendar,
 } from 'lucide-react';
import OnboardingViewProfile from '@/components/onboarding/candidate-profileDetails/OnboardingViewProfile';
import ProfileTrackerViewProfile from '@/components/onboarding/candidate-profileDetails/ProfileTrackerViewProfile';
import AssetsViewProfile from '@/components/onboarding/candidate-profileDetails/AssetsViewProfile';
import TrainingViewProfile from '@/components/onboarding/candidate-profileDetails/TrainingViewProfile';
import BGVViewProfile from '@/components/onboarding/candidate-profileDetails/BGVViewProfile';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import api from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { useOnboardCandidateStore } from '@/store/useCandidateOnboarding';
import { Button } from '@/components/ui/button';
import { isPartner } from '@/store/userStore';


function ColoredBadge({ value, color }: { value: string | number; color: 'blue' | 'green' | 'purple' | 'orange' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 border border-green-300 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200',
    red: 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200',
  };

  return (
    <Badge className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${colorMap[color]}`}>
      {value || '-'}
    </Badge>
  );
}

interface CandidateDetailsViewProps {
  candidateId: string;
  onBack: () => void;
}

export default function CandidateDetailsView({ candidateId, onBack }: CandidateDetailsViewProps) {
  const searchParams = useSearchParams();
  const candidate = searchParams.get('id');
  const { candidateRateCardId } = useOnboardCandidateStore.getState();
  const hasShownError = useRef(false);
  const [activeTab, setActiveTab] = useState('onboarding');
  const [personalDetails, setPersonalDetails] = useState<any>(null);
 
useEffect(() => {
  if (candidate) {
    const numericId = Number(candidate);
    fetchOnboardingDataWithId(numericId);
  }
}, [candidate]);


  const fetchOnboardingDataWithId = async (id: number) => {
    try {
      const res = await api.get(`/onboarding/CandidatePersonalDetails/${id}`);
      const personal = res.data.data;
      setPersonalDetails(personal);
      hasShownError.current = false;
    } catch (err) {
      if (!hasShownError.current) {
        toast.error("Failed to load personal details.");
        hasShownError.current = true;
      }
    }
  };
const { data:rateCarddata , isPending:israteCardPending  } = useQuery({
    queryKey: ["getProfileTracker", candidateRateCardId],
    queryFn: () => onboarding.getRateCard(candidateRateCardId),
    enabled: !!candidateRateCardId,
    retry: 1,
  });


const { data: profileTracker, isPending: isProfileLoading } = useQuery({
    queryKey: ["getProfileTracker", personalDetails?.id],
    queryFn: () => onboarding.getProfileTracker(personalDetails.id),
    enabled: !!personalDetails?.id,
    retry: 1,
  });

  const { data: assetDetails, isPending: isAssetLoading } = useQuery({
    queryKey: ["getAssetDetails", personalDetails?.id],
    queryFn: () => onboarding.getAssetDetails(personalDetails.id),
    enabled: !!personalDetails?.id && activeTab === "assets",
    retry: 1,
  });
 

  const { data: trainingDetails, isPending: isTrainingLoading } = useQuery(
    {
      queryKey: ["getTrainingDetails", personalDetails?.id],
      queryFn: () => onboarding.getTrainingDetails(personalDetails.id),
      enabled: !!personalDetails?.id && activeTab === "training",
      retry: 1,
    }
  );
  

  const { data: bgvDetails, isPending: isBgvLoading } = useQuery({
    queryKey: ["getCandidateBgvDetails", personalDetails?.id],
    queryFn: () => onboarding.getCandidateBgvDetails(personalDetails.id),
    enabled: !!personalDetails?.id && activeTab === "bgv",
    retry: 1,
  });


 

  return (
    <div className="min-h-screen bg-background p-6">
      <Breadcrumbs/>
      <div className=" mx-auto">
        <div className="mb-8 flex items-center justify-between">
          
           <h1 className="text-3xl font-bold text-foreground">Employee Details View</h1>
           
          
           {/* <Button  className="bg-[#00b388] hover:bg-[#009e79] h-9">Reinitiate</Button> */}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4 max-w-xs break-words">
                  <p className="text-sm font-medium text-muted-foreground">HRQID</p>
                  <ColoredBadge value={personalDetails?.hrqId} color="blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4 max-w-xs break-words">
                  <p className="text-sm font-medium text-muted-foreground">Candidate Code</p>
                  <p className="text-lg font-bold">{personalDetails?.candidateCode || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isPartner&&<Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileCheck className="h-8 w-8 text-purple-600" />
                <div className="ml-4 max-w-[200px] ">
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <ColoredBadge value={rateCarddata?.categoryName} color="purple" />
                </div>
              </div>
            </CardContent>
          </Card>}

          {!isPartner && <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4 max-w-[200px] ">
                  <p className="text-sm font-medium text-muted-foreground">Partner Rate</p>
                  <div className='w-32'>
                  <ColoredBadge  value={rateCarddata?.partnerRate} color="orange" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

        </div>

       
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="onboarding">PersonalDetails</TabsTrigger>
            <TabsTrigger disabled={isPartner} value="profile">Profile Tracker</TabsTrigger>
            <TabsTrigger disabled={isPartner} value="assets">Asset Details</TabsTrigger>
            <TabsTrigger disabled={isPartner} value="training">Training Details</TabsTrigger>
            <TabsTrigger  value="bgv">BGV Details</TabsTrigger>
          </TabsList>

          <TabsContent value="onboarding" className="space-y-6">
            <OnboardingViewProfile candidateData={personalDetails} />
          </TabsContent>

          <TabsContent value="profile"  className="space-y-6">
            <ProfileTrackerViewProfile candidateData={profileTracker} />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <AssetsViewProfile candidateData={assetDetails}  personalDetails={personalDetails}/>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <TrainingViewProfile candidateData={trainingDetails} personalDetails={personalDetails}/>
          </TabsContent>


          <TabsContent value="bgv" className="space-y-6">
            <BGVViewProfile candidateData={bgvDetails} personalDetails={personalDetails}/>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
