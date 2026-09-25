"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import EngagementStatusTable from "@/components/engagement-tables/engagement-status-table";

export default function PartnerEngagement() {
    const [activeTab, setActiveTab] = useState("1");
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    return (
        <div className="py-10 px-4 sm:px-6">
            <h1 className="text-2xl font-bold mb-6">Engagement Management</h1>
            <Card>
                <CardContent className="pt-0">
                    <Tabs defaultValue="1" className="w-full" onValueChange={handleTabChange}>
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
                                <TabsTrigger
                                    value="1"
                                    className="flex-1"
                                >
                                    Evaluation In Progress
                                </TabsTrigger>
                                <TabsTrigger
                                    value="2"
                                    className="flex-1"
                                >
                                    Evaluation Expiring
                                </TabsTrigger>
                                <TabsTrigger
                                    value="3"
                                    className="flex-1"
                                >
                                    Evaluation Completed
                                </TabsTrigger>
                                <TabsTrigger
                                    value="4"
                                    className="flex-1"
                                >
                                    Empaneled
                                </TabsTrigger>
                                <TabsTrigger
                                    value="5"
                                    className="flex-1"
                                >
                                    Evaluation Rejected
                                </TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" className="invisible" />
                        </ScrollArea>

                        <TabsContent value="1">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold">Evaluation Inprogress</h2>
                            </div>

                            <EngagementStatusTable statusId={activeTab} />
                        </TabsContent>

                        <TabsContent value="2">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold">Evaluation Expiring</h2>
                            </div>

                            <EngagementStatusTable statusId={activeTab} />
                        </TabsContent>

                        <TabsContent value="3">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold">Evaluation Completed</h2>
                            </div>
                            <EngagementStatusTable statusId={activeTab} />
                        </TabsContent>

                        <TabsContent value="4">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold">Empaneled</h2>
                            </div>
                            <EngagementStatusTable statusId={activeTab} />

                        </TabsContent>
                        <TabsContent value="5">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold">Evaluation Rejected</h2>
                            </div>
                            <EngagementStatusTable statusId={activeTab} />

                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}