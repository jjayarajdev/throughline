'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userRoleAPi } from "@/services/api/user.api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/form-fields/searchable-dropdown";
import { Button } from "@/components/ui/button";
import { partnerApi } from "@/services/api/partner.profile.api";
import api from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Columns4,
  Menu,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "../common/Pagination";

const userRoleMappingSchema = z.object({
  userId: z.string().min(1, "Role is required"),
  roleId: z.string().min(1, "Role is required"),
  partnerId: z.string().optional(),
  isActive: z.boolean().optional(),
})

type FormValues = z.infer<typeof userRoleMappingSchema>;

interface UserRole {
  userId: number;
  fullName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  partnerName?: string; // Optional field for partner name
}

interface Column {
  id: keyof UserRole | "actions";
  label: string;
  visible: boolean;
  sortable?: boolean;
}

interface User {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  roleName: string;
  // Add other user properties as needed
}

const UserRoleMapping = () => {



  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoleForTable, setSelectedRoleForTable] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [pageSize, setPageSize] = useState(50);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(userRoleMappingSchema),
    defaultValues: {
      userId: "",
      roleId: "",
      partnerId: "",
      isActive: true, // Default value for isActive
    },
  });

  const selectedRole = form.watch("roleId") || null;
  const selectedUserID = form.watch("userId") || null;

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

  // API query for user roles table (similar to candidate-bin-list)
  const {
    data: userRolesResponse,
    isLoading: isLoadingUserRoles,
    error: userRolesError,
    refetch: refetchUserRoles,
  } = useQuery({
    queryKey: ["userRoles", selectedRole, currentPage, selectedUserID],
    queryFn: async () => {

      let url = `/User/paged/user-roles?isActive=true`;
      if (selectedRole) {
        url += `&roleId=${selectedRole}`;
      }
      if (selectedUserID) {
        url += `&userId=${selectedUserID}`;
      }
      const response = await api.post(url, {
        pageNumber: currentPage,
        pageSize: pageSize,
      });
      return response.data;
    },

  });

  // const { data: userListActive = [] } = useQuery({
  //   queryKey: ["userList"],
  //   queryFn: () => userRoleAPi.getActiveInactiveUsers(true),
  // });

  if (userRolesError) {
    toast.error("Failed to fetch user roles");
  }

  const onSubmit = async (data: FormValues) => {
    const updatePayload = {
      ...data,
      partnerId: data.partnerId === "" ? null : data.partnerId,
    }
    try {
      const res = await api.post("/User/user-role-mapping", updatePayload);
      if (res.status === 200) {
        toast.success("User role mapping created successfully!");
        refetchUserRoles()
      } else {
        console.error("Failed to submit form:", res.data);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.response.data.message);
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSort = (key: keyof UserRole) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig?.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnId: keyof UserRole) => {
    if (!sortConfig || sortConfig.key !== columnId) {
      return null;
    }
     return (sortConfig?.direction === "asc"&& sortConfig?.key ===columnId) ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  // Remove user role mutation
  const removeUserRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await api.delete(`/User/remove-user-role?userId=${userId}&roleId=${roleId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("User role removed successfully");
      refetchUserRoles();
    },
    onError: (error: any) => {
      console.error("Error removing user role:", error);
      toast.error(error.response?.data?.message || "Failed to remove user role");
    }
  });

  const handleDeleteUserRole = async (userId: number, roleId: number) => {
    // Implement delete functionality if needed
    removeUserRoleMutation.mutate({ userId, roleId });
  };
  const roleId = form.watch("roleId");         // subscribed: will cause re-render
const partnerVisible = Number(roleId) === 4; // robust to "4" or 4

const columns: Column[] = useMemo(
  () => [
    { id: "fullName", label: "Full Name", visible: true, sortable: true },
    { id: "roleName", label: "Role Name", visible: true, sortable: true },
    { id: "partnerName", label: "Partner Name", visible: partnerVisible, sortable: true },
    { id: "email", label: "Email", visible: true, sortable: true },
    { id: "actions", label: "Actions", visible: true },
  ],
  [partnerVisible]
);
  const visibleColumns = columns.filter((col) => col.visible);

  // Extract data from API response (similar to candidate-bin-list)
  const userRoles = userRolesResponse?.data?.items || [];
  const hasPrevious = userRolesResponse?.data?.hasPrevious;
  const hasNext = userRolesResponse?.data?.hasNext;
  const totalPages = userRolesResponse?.data?.totalPages;
  const currentPageNumber = userRolesResponse?.data?.currentPage;

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
                  <FormLabel>
                    User <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableDropdown
                      options={userList?.map((option: any) => ({
                        value: option.userId.toString(),
                        label: option.email,
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
                              (opt: any) =>
                                opt.roleId.toString() ===
                                field.value?.toString()
                            )?.roleName}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoleList.map((option: any) => (
                        <SelectItem
                          key={option.roleId}
                          value={option.roleId.toString()}
                          className=""
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

            {selectedRole === "4" ? (
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
            ) : null}
      <div className="flex items-end">
        <Button type="button" variant="hpButton" onClick={()=>{
          form.reset();
        }} className="w-32">
          Clear
        </Button>
      </div>
         
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="hpButton" className="px-8">
              Submit
            </Button>
          </div>
        </form>
      </Form>

      {/* User Roles Table Section */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">User Role Table</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-[#007E61]"
                >
                  <Columns4 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                  {columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={column.id}
                        checked={column.visible}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <label
                        htmlFor={column.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {column.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {(selectedRole || selectedUserID) && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
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
                        column.sortable &&
                        handleSort(column.id as keyof UserRole)
                      }
                    >
                      <div className="flex items-center">
                        {column.label}
                        {column.sortable &&
                          getSortIcon(column.id as keyof UserRole)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUserRoles ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="text-center py-4"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : userRoles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="text-center py-4"
                    >
                      No users found for this role
                    </TableCell>
                  </TableRow>
                ) : (
                  userRoles.map((userRole: UserRole) => (
                    <TableRow key={userRole.userId}>
                      {visibleColumns.map((column) => (
                        <TableCell key={`${userRole.userId}-${column.id}`}>
                          {column.id === "actions" ? (
                            <div className="flex items-center gap-2">
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="h-8 p-2">
                                    <Menu className="h-4 w-4" />
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px]"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteUserRole(
                                        userRole.userId,
                                        userRole.roleId
                                      )
                                    }
                                    className="h-8 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Role
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : column.id === "parnterName" ? (
                            <span className="text-gray-500">N/A</span>
                          ) : (
                            userRole[column.id as keyof UserRole]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          {userRoles.length > 0 && (
            <div className="flex items-center justify-between p-4">
                   <div className="text-sm text-gray-500">
                              Page {currentPageNumber} of {totalPages}
                            </div>
                            <Pagination
                              value={pageSize}
                              totalEntry={userRolesResponse?.data?.totalCount}
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
          )}
        </div>
      )}
    </div>

  </>)
}

export default UserRoleMapping