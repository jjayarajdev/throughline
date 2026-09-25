"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CartPage from "@/components/hiring-forms/CartTable";
import BinPage from "@/components/hiring-forms/BinPage";
import { ClipboardList, InboxIcon, Users } from "lucide-react";
import {
  isAdmin,
  isAllhrqidReviewRequest,
  isHiringEdit,
  isRmowner,
  isVendorManager,
} from "@/store/userStore";
import PartnerHrqs from "@/components/hiring-forms/PartnerHrqs";

const HiringTabsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>("cart");

  // Sync tab state with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "cart" || tab === "bin") {
      setValue(tab);
    }
  }, [searchParams]);

  const handleTabChange = (newValue: string) => {
    setValue(newValue);
    router.replace(`${pathname}?tab=${newValue}`);
  };

  return (
    <div className="p-2">
      <Tabs value={value} className="w-full" onValueChange={handleTabChange}>
        {(isHiringEdit || isAllhrqidReviewRequest) && (
          <TabsList className="flex w-auto justify-start gap-2 self-end">
            <TabsTrigger value="cart">
              <InboxIcon className="h-4 w-4" />
              All Approved Requests
            </TabsTrigger>
            {(isRmowner || isVendorManager || isAdmin) && (
              <TabsTrigger value="partner">
                <Users className="h-4 w-4" />
                Partners Wise
              </TabsTrigger>
            )}

            {(isAllhrqidReviewRequest ) && (
              <TabsTrigger value="bin">
                <ClipboardList className="h-4 w-4" />
                Review Requests
              </TabsTrigger>
            )}
          </TabsList>
        )}

        <TabsContent value="cart">
          <CartPage />
        </TabsContent>
        <TabsContent value="partner">
          <PartnerHrqs/>
        </TabsContent>
          <TabsContent value="bin">
            <BinPage />
          </TabsContent>
      </Tabs>
    </div>
  );
};

export default HiringTabsPage;
