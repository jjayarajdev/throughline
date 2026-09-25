"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/partner-form/Profileform";
import ContactMatrixForm from "@/components/partner-form/ContactMatrixform";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { use, useCallback, useEffect, useLayoutEffect, useState } from "react";
import EscalationMatrixForm from "@/components/partner-form/EscalationMatrixForm";
import EngagementForm from "@/components/partner-form/EngagementForm";
import { usePartnerStore } from "@/store/userPartnerStore";
import SowPoManagement from "@/components/partner-form/sow/SowPoManagement";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
const TABS = ["profile", "contact", "escalation", "engagement", "sow"] as const;
export default function Home() {


  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("profile");
  const { partnerStatus: partnerStatusName, isPartnerEmpanelled } = usePartnerStore();

  const router = useRouter()
  useLayoutEffect(() => {
    setMounted(true);
  }, []);
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof TABS[number]);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`);
  };
  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab);
  }, [searchParams]);

  const handlePrevious = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  }, [activeTab]);

  const handleNext = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  }, [activeTab]);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <div className="py-10 px-4 sm:px-6">
      <Breadcrumbs />
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
                <TabsTrigger value="profile" className="flex-1">
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="flex-1"
                  disabled={partnerStatusName}
                >
                  Contact Matrix
                </TabsTrigger>
                <TabsTrigger
                  value="escalation"
                  className="flex-1"
                  disabled={partnerStatusName}
                >
                  Escalation Matrix
                </TabsTrigger>
                <TabsTrigger
                  value="engagement"
                  className="flex-1"
                  disabled={partnerStatusName}
                >
                  Engagement
                </TabsTrigger>
                <TabsTrigger
                  value="sow"
                  className="flex-1"
                  disabled={!isPartnerEmpanelled}
                >
                  SOW/PO  Management
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
            <TabsContent value="profile">
              <ProfileForm onNext={handleNext} onPrevious={handlePrevious} />

            </TabsContent>
            <TabsContent value="contact">
              <ContactMatrixForm
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="escalation">
              <EscalationMatrixForm
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            </TabsContent>
            <TabsContent value="engagement">
              <EngagementForm onNext={handleNext} onPrevious={handlePrevious} />
            </TabsContent>
            <TabsContent value="sow">
              <SowPoManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
