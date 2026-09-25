"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Calendar, Settings2Icon, User2, Users } from "lucide-react";

import PartnerSlotPagination from "@/components/slot-management/PartnerslotPagination";
import MasterTypesPage from "@/components/master/Master";
import UserRoleMapping from "@/components/master/Approval-roles";

const DEFAULT_TAB = "master";

export default function page() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") ?? DEFAULT_TAB);

  // Update state when the URL param changes
  useEffect(() => {
    const urlTab = params.get("tab");
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [params]);

  // When tab changes, update the URL
  const handleTabChange = (value: string) => {
    setTab(value);
    router.replace(`?tab=${value}`);
  };

  return (
    <div className="py-5 px-4 sm:px-6">
      
      <Card>
        <CardContent className="pt-6">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="w-full h-12  mb-4">
                <TabsTrigger value="master" className="flex-1 gap-2">
                  <Settings2Icon className="h-4 w-4" />
                  Master Management
                </TabsTrigger>
                <TabsTrigger value="user-roles" className="flex-1 gap-2">
                  <Users className="h-4 w-4" />
                  User Roles
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
            <TabsContent value="master">
              <MasterTypesPage/>
            </TabsContent>
            <TabsContent value="user-roles">
              <UserRoleMapping/>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
