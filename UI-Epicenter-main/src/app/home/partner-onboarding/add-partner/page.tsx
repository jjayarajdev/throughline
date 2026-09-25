"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import CreateProfileForm from "@/components/partner-form/create-forms/CreateProfileForm";
import CreateContactMatrixForm from "@/components/partner-form/create-forms/CreateContactMatrixForm";
import CreateEscalationMatrixForm from "@/components/partner-form/create-forms/CreateEscalationMatrixForm";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { usePartnerStore } from "@/store/userPartnerStore";

export default function AddPartner() {
    const [activeTab, setActiveTab] = useState("profile");
    const { partnerId,contactMatrixId } = usePartnerStore();
    const checking = false
    const handleTabChange = (value: string) => {
        setActiveTab(value);
    };

    const handlePrevious = () => {
        const tabs = ["profile", "contact", "escalation", "engagement", "po"];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabs[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        const tabs = ["profile", "contact", "escalation", "engagement", "po"];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
            setActiveTab(tabs[currentIndex + 1]);
        }
    };

    return (
        <div className="py-10 px-4 sm:px-6">
            <Breadcrumbs/>
            <Card>
                <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <ScrollArea className="w-full whitespace-nowrap">
                            <TabsList className="w-full h-12 bg-[#DFE6E5] dark:border-white/[0.05] dark:bg-white/[0.03]">
                                <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
                                <TabsTrigger value="contact" className="flex-1" disabled={!partnerId}>Contact Matrix</TabsTrigger>
                                <TabsTrigger value="escalation" className="flex-1" disabled={!contactMatrixId}>Escalation Matrix</TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" className="invisible" />
                        </ScrollArea>
                        <TabsContent value="profile">
                            <CreateProfileForm onNext={handleNext} onPrevious={handlePrevious} />
                        </TabsContent>
                        <TabsContent value="contact">
                            <CreateContactMatrixForm onNext={handleNext} onPrevious={handlePrevious} />
                        </TabsContent>
                        <TabsContent value="escalation">
                            <CreateEscalationMatrixForm onNext={handleNext} onPrevious={handlePrevious} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}