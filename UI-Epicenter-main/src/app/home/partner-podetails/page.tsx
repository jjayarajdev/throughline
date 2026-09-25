"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import PartnerSowManagement from "@/components/sow-management/partner-sow-list";
import CompleteSowList from "@/components/sow-management/sow-list";

export default function SowManagement() {
    const [activeTab, setActiveTab] = useState("partnerwise");

    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };


    return (
        <div className="py-10 px-4 sm:px-6">
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold mb-4">Sow Management</h1>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
                                <TabsTrigger value="partnerwise" className="flex-1">Partner Wise</TabsTrigger>
                                <TabsTrigger value="sowList" className="flex-1">Complete Sow List</TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" className="invisible" />
                        </ScrollArea>
                        <TabsContent value="partnerwise">
                            <PartnerSowManagement />
                        </TabsContent>
                        <TabsContent value="sowList">
                            <CompleteSowList />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}