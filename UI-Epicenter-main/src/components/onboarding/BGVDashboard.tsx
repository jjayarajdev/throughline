'use client';
import BasicInformationForm from './bgv-childs/BasicInformationForm';
import BGVStatusForm from './bgv-childs/BGVStatusForm';
interface IProps {
  onSave: (data: any) => void;
  onboardingTimeline: Partial<any>;
  personalDetails:any
}

function BGVDashboard({ onSave, onboardingTimeline,personalDetails }: IProps) {
   
 
  return (
   
        <div >
         
          <BasicInformationForm onSave={onSave} onboardingTimeline={onboardingTimeline} personalDetails={personalDetails} />
           {/* <BGVStatusForm  onSave={onSave} onboardingTimeline={onboardingTimeline} /> */}
         
        </div>
   
  );
}

export default BGVDashboard;
