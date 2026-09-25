"use client";
import BasicInformationForm from "./bgv-childs/BasicInformationForm";

interface IProps {
  onSave: (data: any) => void;
  onboardingTimeline: Partial<any>;
  personalDetails: any;
}

/** Background-verification tab: the combined BGV form (the separate status form is not shown). */
function BGVDashboard({ onSave, onboardingTimeline, personalDetails }: IProps) {
  return <BasicInformationForm onSave={onSave} onboardingTimeline={onboardingTimeline} personalDetails={personalDetails} />;
}

export default BGVDashboard;
