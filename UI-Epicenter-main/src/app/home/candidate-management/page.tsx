"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateCartTable } from "@/components/candidate/candidate-cart-table";
import { CandidateBinTable } from "@/components/candidate/candidate-bin-table";
import { CandidateHiringRequests } from "@/components/candidate/Hiring-Table";
import { useUserStore } from "@/store/userStore";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { ParnterSlotsheet } from "@/components/slot-management/sheets/Parnterslotsheet";
import { CandidateHistory } from "@/components/candidate/CandidateHistory";

export default function CandidateManagement() {
  const { partnerId } = useUserStore();
  const [activeTab, setActiveTab] = useState(partnerId ? "all" : "cart");
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Candidate Management</h1>
      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="flex w-auto justify-start gap-2 self-end">
          <TabsTrigger value="cart">Candidates List</TabsTrigger>
          {partnerId && <TabsTrigger value="all">All HRQID</TabsTrigger>}
          <TabsTrigger value="bin">Review Candidates</TabsTrigger>
          {/* <TabsTrigger value="history">Candidate History</TabsTrigger> */}
        </TabsList>
        <TabsContent value="cart">
          <CandidateCartTable />
        </TabsContent>
        <TabsContent value="all">
          <CandidateHiringRequests filterType={FilterTypeEnum.All_HRQID}  id={partnerId} />
        </TabsContent>
        <TabsContent value="bin">
          <CandidateBinTable />
        </TabsContent>
        {/* <TabsContent value="history">
          <CandidateHistory />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
