import * as Dialog from "@radix-ui/react-dialog";
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/form-fields/DatePickerField";
import { InputField } from "@/components/form-fields/InputField";
import { SelectField } from "@/components/form-fields/SelectField";
import { useQuery } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { Form } from "@/components/ui/form";
import { partnerApi } from "@/services/api/partner.profile.api";
import { useState } from "react";
import { useDebounce } from "@/lib/useDebounce";
import Pagination from "@/components/common/Pagination";
import { formatDate } from "@/helpers/helper";

type EvalSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationForm: any;
  onSubmit: (data: any) => void;
  actionType: "extended" | "completed" | null;
  completedOptions: { id: number; name: string }[];
  selectedEngagement: any;
};

export const EvaluationSidebarOnly = ({
  open,
  onOpenChange,
  evaluationForm,
  onSubmit,
  actionType,
  completedOptions,
  selectedEngagement,
}: EvalSidebarProps) => {
  const evalStatus = useWatch({
    control: evaluationForm.control,
    name: "evaluationStatusId",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 300);
  const [pageSize, setPageSize] = useState(50);

  const { data: rejectionReasons = [] } = useQuery({
    queryKey: ["rejectionReason"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.REJECTION_REASON),
  });

  const {
    data: getEngagementDetails,
    refetch: reFetchData,
    isPending,
  } = useQuery({
    queryKey: [
      "getEngagement",
      selectedEngagement?.id,
      currentPage,
      debouncedSearch,
      pageSize,
    ],
    queryFn: () =>
      partnerApi.getEvaluationExtended(selectedEngagement?.id, {
        pageNumber: currentPage,
        pageSize,

        searchText: debouncedSearch || undefined,
      }),
    enabled: !!selectedEngagement?.id,
    refetchOnWindowFocus: true,
  });

  const getEngagementData = getEngagementDetails?.items || [];
  const hasPrevious = getEngagementDetails?.hasPrevious;
  const hasNext = getEngagementDetails?.hasNext;
  const totalPages = getEngagementDetails?.totalPages || 1;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content className="fixed top-0 right-0 w-[600px] h-full bg-white dark:bg-gray-900 p-6 shadow-lg z-50 overflow-y-auto">
          <Form {...evaluationForm}>
            <form onSubmit={evaluationForm.handleSubmit(onSubmit)}>
              {actionType === "extended" && (
                <div className="space-y-4">
                  <DatePickerField
                    control={evaluationForm.control}
                    name="evaluationExtendedDate"
                    label="Evaluation Extended Date"
                    required
                  />
                  <InputField
                    control={evaluationForm.control}
                    name="extendedComments"
                    label="Evaluation Extended Comments"
                    placeholder="Enter extended comments"
                    required
                    maxLength={150}
                  />
                </div>
              )}

              {actionType === "completed" && (
                <div className="space-y-4">
                  <SelectField
                    control={evaluationForm.control}
                    name="evaluationStatusId"
                    label="Evaluation Status"
                    placeholder="Select Status"
                    options={completedOptions}
                    required
                  />
                  {evalStatus === "11004" && (
                    <>
                      <SelectField
                        control={evaluationForm.control}
                        name="rejectionReasonId"
                        label="Reasons of rejection"
                        placeholder="Enter reason of rejection"
                        options={rejectionReasons}
                        required
                      />
                      <InputField
                        control={evaluationForm.control}
                        name="rejectionReason"
                        label="Rejection Comments"
                        placeholder="Enter rejection comments"
                        required
                      />
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Dialog.Close asChild>
                  <Button
                    onClick={() => {
                      evaluationForm.setValue("evaluationExtendedDate", "");
                      evaluationForm.setValue("extendedComments", "");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  className="bg-[#00b388] hover:bg-[#009e79]"
                >
                  Submit
                </Button>
              </div>
            </form>
          </Form>
          {actionType === "extended" && (
            <>
              <div className="mt-6 h-[500px] overflow-auto border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <h4 className="text-lg font-semibold text-[#00b388] hover:text-[#009e79] transition-colors duration-200 mb-2">
                  Evaluation Extension History
                </h4>

                {getEngagementData.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No records found
                  </div>
                ) : (
                  getEngagementData.map((candidate: any) => (
                    <div
                      key={candidate.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">Extended By:</span>{" "}
                        {candidate?.createdUserName || "-"}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <span className="font-medium">Extended Date:</span>{" "}
                        {formatDate(candidate?.evaluationExtendedDate)}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Comments:</span>{" "}
                        {candidate?.extendedComments
                          ? candidate?.extendedComments.length > 250
                            ? `${candidate?.extendedComments.slice(0, 250)}...`
                            : candidate?.extendedComments
                          : "-"}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <Pagination
                  value={pageSize}
                  totalEntry={getEngagementDetails?.data?.totalCount}
                  onChange={(newSize) => {
                    setPageSize(newSize);
                  }}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                />
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
