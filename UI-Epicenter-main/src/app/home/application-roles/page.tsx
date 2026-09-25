'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { userRoleAPi } from "@/services/api/user.api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/form-fields/searchable-dropdown";
import { Button } from "@/components/ui/button";
import { partnerApi } from "@/services/api/partner.profile.api";
import api from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import TableSkeletonLoader from "@/components/skelton/TableSkelton";

const userRoleMappingSchema = z.object({
    userId: z.string().min(1, "Role is required"),
    roleId: z.string().min(1, "Role is required"),
    partnerId: z.string().optional(),
    isActive: z.boolean().optional(),
})

type FormValues = z.infer<typeof userRoleMappingSchema>;
interface User {
    userId: string;
    firstName: string;
    lastName: string;
    userName: string;
    email: string;
    roleName: string;
    // Add other user properties as needed
}

interface Column {
    id: keyof User | "actions";
    label: string;
    visible: boolean;
    sortable?: boolean;
}

const UserRoleMapping = () => {
    const [columns, setColumns] = useState<Column[]>([
        { id: "firstName", label: "First Name", visible: true },
        { id: "lastName", label: "Last Name", visible: true },
        { id: "userName", label: "User Name", visible: true },
        { id: "email", label: "Email", visible: true },
        { id: "roleName", label: "Role Name", visible: true },
        { id: "actions", label: "Actions", visible: true },
    ]);

    const form = useForm<FormValues>({
        resolver: zodResolver(userRoleMappingSchema),
        defaultValues: {
            userId: "",
            roleId: "",
            partnerId: "",
            isActive: true, // Default value for isActive
        },
    });

    const { data: userList = [] } = useQuery({
        queryKey: ["userList"],
        queryFn: () => userRoleAPi.getUsers(),
        enabled: true,
    });

    const { data: userRoleList = [] } = useQuery({
        queryKey: ["userRoleList"],
        queryFn: () => userRoleAPi.getRoles(),
        enabled: true,
    });

    const {
        data: partnerList = [],
    } = useQuery({
        queryKey: ["partnerList"],
        queryFn: () =>
            partnerApi.getAllPartner(),
    });


    const { data: userListActive = [], isLoading } = useQuery({
        queryKey: ["userList"],
        queryFn: () => userRoleAPi.getActiveInactiveUsers(true),
    });

    const onSubmit = async (data: FormValues) => {
        try {
            const res = await api.post("/User/user-role-mapping", data);
            if (res.status === 200) {
                toast.success("User role mapping created successfully!");
                form.reset(); // Reset the form after successful submission
            } else {
                console.error("Failed to submit form:", res.data);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const visibleColumns = columns.filter((col) => col.visible);

    const partners = userListActive || [];
    const hasPrevious = userListActive?.hasPrevious;
    const hasNext = userListActive?.hasNext;
    const totalPages = userListActive?.totalPages;
    const currentPageNumber = userListActive?.currentPage;


    return (<>
        <h3 className="text-lg font-semibold mb-6">Application Roles</h3>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>User <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <SearchableDropdown
                                        options={userList?.map((option: any) => ({
                                            value: option.userId.toString(),
                                            label: option.email
                                        }))}
                                        value={field.value?.toString()}
                                        onChange={field.onChange}
                                        placeholder="Name"
                                        searchPlaceholder="Search email..."
                                        className="w-full"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="roleId"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="text-sm font-medium">
                                    Role Type
                                    <span className="text-red-500">*</span>
                                </FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger className="h-10 w-full">
                                            <SelectValue placeholder="Select Role">
                                                {field.value &&
                                                    userRoleList.find(
                                                        (opt: any) => opt.roleId.toString() === field.value?.toString()
                                                    )?.roleName}
                                            </SelectValue>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {userRoleList.map((option: any) => (
                                            <SelectItem
                                                key={option.roleId}
                                                value={option.roleId.toString()}
                                                className="text-gray-500"
                                            >
                                                {option.roleName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="partnerId"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Partner*</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2 items-center">
                                        <SearchableDropdown
                                            options={partnerList?.data?.map((option: any) => ({
                                                value: option.id.toString(),
                                                label: option.partnerName,
                                            }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Partner"
                                            searchPlaceholder="Search Partner..."
                                            className="flex-1"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" variant="hpButton" className="px-8">
                        Submit
                    </Button>
                </div>

            </form>
        </Form>
        {/* 
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
        {isLoading ? (
          <TableSkeletonLoader />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-teal-200 dark:bg-gray-700">
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={
                      column.sortable ? "cursor-pointer select-none" : ""
                    }
                    onClick={() =>
                      column.sortable && handleSort(column.id as keyof Partner)
                    }
                  >
                    <div className="flex items-center">
                      {column.label}
                      {column.sortable &&
                        getSortIcon(column.id as keyof Partner)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="text-center py-4"
                  >
                    No partners found
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    {visibleColumns.map((column) => (
                      <TableCell key={`${partner.id}-${column.id}`}>
                        {column.id === "partnerCode" ? (
                          <Link
                            href={`/home/partner-onboarding/partner-profile/${partner.partnerCode}`}
                            className="text-[#4096ff] hover:underline"
                          >
                            {partner.partnerCode}
                          </Link>
                        ) : column.id === "partnerStatusName" ? (
                          <StatusBadge
                            status={partner.partnerStatusName as any}
                          />
                        ) : column.id === "approverName" ? (
                          partner.approverName || "N/A"
                        ) : column.id === "startDate" ? (
                          new Date(partner.startDate).toLocaleDateString()
                        ) : column.id === "approvedStatus" ? (
                          <span
                            className={`
                        font-medium 
                        ${
                          partner.approvedStatus == null
                            ? "text-yellow-600"
                            : partner.approvedStatus
                            ? "text-green-600"
                            : "text-red-600"
                        }
                        `}
                          >
                            {partner.approvedStatus == null
                              ? "Pending"
                              : partner.approvedStatus
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        ) : column.id === "actions" ? (
                          <div className="flex items-center gap-2">
                            <TooltipWrapper content="Edit">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="h-8  p-2"
                                  >
                                    <Menu />
                                    <ChevronDown />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px]"
                                >
                                  <DropdownMenuItem
                                    disabled={partner.approvedStatus == null}
                                    onClick={() => {
                                      setPartnerStatus(partner.approvedStatus);
                                      setPartnerId(partner.id.toString());
                                      setPartnerCode(partner.partnerCode);
                                      setIsPartnerEmpanelled(
                                        partner.isEmpaneled
                                      );
                                      router.push(
                                        `/home/partner-onboarding/edit-partner?id=${partner.id}`
                                      );
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 text-gray-500" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TooltipWrapper>
                          </div>
                        ) : (
                          partner[column.id as keyof Partner]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-gray-500">
            Page {currentPageNumber} of {totalPages}
          </div>
       <Pagination
            value={pageSize}
            totalEntry={hiringCartData?.data.totalCount}
            onChange={(newSize) => {
              setPageSize(newSize);
            }}
            currentPage={currentPage}
            totalPages={totalPages || 0}
            onPageChange={setCurrentPage}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </div>
      </div> */}

    </>)
}

export default UserRoleMapping