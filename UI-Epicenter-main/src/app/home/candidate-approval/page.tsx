"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserCheck, CheckCircle2 } from "lucide-react";
import { CandidateApprovalTable } from "@/components/candidate/candidate-approval-table";
import { OnboardApprovalTable } from "../candidate-onboarding/candidate-sidebar/Onboard-approval-table";
import { DocsApprovalTable } from "../candidate-onboarding/candidate-sidebar/Docs-approval-table";
import { isAdmin, isRmowner, isVendorManager } from "@/store/userStore";
import { ContactMatrixformApproval } from "../partner-onboarding/partner-approval/ContactMatrixform-approval";
import SowApproval from "../partner-onboarding/partner-approval/Sow-approval";
import { Onholdapproval } from "../partner-onboarding/partner-approval/On-hold-approval";

const DEFAULT_TAB = "candidate";
const DEFAULT_CHILD_TABS = {
  onboarding: "final-onboard",
  Vendor: "sow",
};
export default function CandidateApprovalPage() {
const router = useRouter();
  const params = useSearchParams();

  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);
  const [childTabs, setChildTabs] = useState(DEFAULT_CHILD_TABS);

  
useEffect(() => {
  const urlTab = params.get("tab") ?? DEFAULT_TAB;
  const urlChildTab = params.get("childTab");
  if (urlTab !== tab) setTab(urlTab);
  if (urlChildTab) {
    setChildTabs((prev) => ({
      ...prev,
      [urlTab]: urlChildTab, 
    }));
  }
}, [params]);


const handleChildTabChange = (parent: string, value: string) => {
  setChildTabs((prev) => ({ ...prev, [parent]: value }));
  router.replace(`?tab=${tab}&childTab=${value}`);
};

const handleTabChange = (value: string) => {
  setTab(value);
  const child = childTabs[value as keyof typeof childTabs] ?? "";
  router.replace(`?tab=${value}&childTab=${child}`);
};

  return (
    <div className="p-3">
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h1 className="text-2xl font-bold">Exception Approvals</h1>
          <ScrollArea className="whitespace-nowrap w-full sm:w-auto">
            <TabsList className="flex h-12 gap-2">
               
              <TabsTrigger
                value="candidate"
                className="flex items-center gap-2 px-4 py-2"
              >
                <UserCheck className="h-4 w-4" />
                Candidate Exception 
              </TabsTrigger>
              {!isRmowner &&<TabsTrigger
                value="onboarding"
                className="flex items-center gap-2 px-4 py-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Onboarding Exception 
              </TabsTrigger>}
               {(isVendorManager || isAdmin) &&<TabsTrigger
                value="Vendor"
                className="flex items-center gap-2 px-4 py-2"
              >
                <UserCheck className="h-4 w-4" />
                Partner Exception 
              </TabsTrigger>}
            </TabsList>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

       
        <TabsContent value="candidate">
          <Card>
            <CardContent className="pt-6">
              <CandidateApprovalTable />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="Vendor">
          <Card>
            <CardContent className="pt-6">
              <Tabs   value={childTabs.Vendor}
                onValueChange={(val) => handleChildTabChange("Vendor", val)}
                 className="w-full">
                <TabsList className="flex w-full mb-4">
                  <TabsTrigger value="sow" className="flex-1">
                    Sow
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex-1">
                    Contact & Escalation Matrix
                  </TabsTrigger>
                   {isAdmin && <TabsTrigger value="on-Hold" className="flex-1">
                    On Hold
                  </TabsTrigger>}
                </TabsList>

                <TabsContent value="sow" className="w-full">
                  <SowApproval />
                </TabsContent>

                <TabsContent value="contact" className="w-full">
                  <ContactMatrixformApproval />
                </TabsContent>

                 <TabsContent value="on-Hold" className="w-full">
                  <Onholdapproval />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="onboarding">
          <Card>
            <CardContent className="pt-6">
              <Tabs   value={childTabs.onboarding}
                onValueChange={(val) => handleChildTabChange("onboarding", val)}
                 className="w-full">
                <TabsList className="flex w-full mb-4">
                  <TabsTrigger value="final-onboard" className="flex-1">
                    Final Onboard Acceptance
                  </TabsTrigger>
                  <TabsTrigger value="nda-cda" className="flex-1">
                    NDA/CDA Confirmation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="final-onboard" className="w-full">
                  <OnboardApprovalTable />
                </TabsContent>

                <TabsContent value="nda-cda" className="w-full">
                  <DocsApprovalTable />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
