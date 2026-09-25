"use client";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ErrorHandler } from "@/components/error/ErrorHandler";
import { HiringDetailsTable } from "@/components/hiring-forms/HiringDetailsTable";
import { HiringDetailsSkeleton } from "@/components/hiring-forms/HiringProfileSkelton";
import { SelectedTalentsTable } from "@/components/hiring-forms/profile/SelectedTalentsTable";
import { SlotAllocationCard } from "@/components/hiring-forms/profile/SlotAllocationCard";
import { UpcomingInterviewsCard } from "@/components/hiring-forms/profile/UpcomingInterviewsCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hiringApi } from "@/services/api/hiring.api";
import { useQuery } from "@tanstack/react-query";
import {  useSearchParams } from "next/navigation";

export default function page() {
  const searchParams = useSearchParams();
  const  hiring  = searchParams.get("id");
  const { data: hiringProfile, isLoading,error} = useQuery({
    queryKey: ["hiringProfile", hiring],
    queryFn: () => hiringApi.getHiringProfile(String(hiring)),
    enabled: !!hiring,
  });
if(error)return <ErrorHandler error={error} />;
if (isLoading) return <HiringDetailsSkeleton />;

  return (
    <div className="p-6">
      <Breadcrumbs />
      <div className="flex items-center mb-6"></div>
      <div className="flex items-start gap-8">
        {/* Left Column */}
        <div className="flex-1">
          <Card className="bg-white dark:bg-gray-800 p-6 mb-6">
          
            <HiringDetailsTable data={hiringProfile?.hiringDetails} />
          </Card>

          <Tabs defaultValue="talentBench" className="w-full">
            <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
              <TabsTrigger value="talentBench" className="flex-1">
                Talent Pool ( {hiringProfile?.talentBench.length} )
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="flex-1">
                Talent Pipeline  ( {hiringProfile?.talentPipeline.length} ) 
              </TabsTrigger>

              <TabsTrigger value="selected" className="flex-1">
                Identified Talents  ( {hiringProfile?.selectedTalents.length} )
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1">
                Rejected Talents  ( {hiringProfile?.rejectedCandidates.length} )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="talentBench">
              <SelectedTalentsTable
                 actionVisible={false}
                talents={hiringProfile?.talentBench}
                onToggleAll={(checked) => console.log("all toggled:", checked)}
                onToggleOne={(id, checked) =>
                  console.log(id, "toggled:", checked)
                }
              />
            </TabsContent>
            <TabsContent value="pipeline">
              <SelectedTalentsTable
                 actionVisible={false}
                talents={hiringProfile?.talentPipeline}
                onToggleAll={(checked) => console.log("all toggled:", checked)}
                onToggleOne={(id, checked) =>
                  console.log(id, "toggled:", checked)
                }
              />
            </TabsContent>
            <TabsContent value="selected">
              <SelectedTalentsTable
               actionVisible={true}
                talents={hiringProfile?.selectedTalents}
                onToggleAll={(checked) => console.log("all toggled:", checked)}
                onToggleOne={(id, checked) =>
                  console.log(id, "toggled:", checked)
                }
              />
            </TabsContent>
            <TabsContent value="rejected">
              <SelectedTalentsTable
              actionVisible={false}
                talents={hiringProfile?.rejectedCandidates}
                onToggleAll={(checked) => console.log("all toggled:", checked)}
                onToggleOne={(id, checked) =>
                  console.log(id, "toggled:", checked)
                }
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="w-1/4 ">
          <UpcomingInterviewsCard
            interviews={hiringProfile?.upcomingInterviews}
            onSeeAll={() => {}}
          />
          <SlotAllocationCard data={hiringProfile.partnerContributions} />
        </div>
      </div>
    </div>
  );
}
