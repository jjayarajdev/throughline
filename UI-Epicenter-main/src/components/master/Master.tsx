"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dropdownApi } from "@/services/api/master";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/axiosInstance";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { onboarding } from "@/services/api/onboarding.api";
import Pagination from "../common/Pagination";

enum MasterTypes {
  REJECTION_REASON = 24,
  DOMAIN = 29,
  SUBDOMAIN = 30,
  SKILL = 31,
  FEEDBACK_CATEGORY = 33,
  TECHNICAL_SKILLS = 33001,
  COMMUNICATION_SKILLS = 33002,
  BEHAVIOURAL_SKILLS = 33003,
  CULTURAL_ART = 33004,
  LEADERSHIP_AND_OWNERSHIP = 33005,
  OVERALL_ASSESSMENT = 33006,
  NotificationCategory = 42,
}

interface MasterData {
  id: number;
  name: string;
  isActive: boolean;
  domainManagerName?: string; // Only for DOMAIN type
  subDomainManagerName?: string; // Only for SUBDOMAIN type
  stateId?: number;
  countryId?: number;
  domainId?: number;
}

export default function Master() {
  const [selectedType, setSelectedType] = useState<MasterTypes | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MasterData | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editManagerId, setEditManagerId] = useState<string>("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemManagerId, setNewItemManagerId] = useState<string>("0");
  const [isActiveFilter, setIsActiveFilter] = useState(true); // New state for active/inactive filter
  const queryClient = useQueryClient();
  const [editManagerSearchTerm, setEditManagerSearchTerm] = useState("");
  const [newManagerSearchTerm, setNewManagerSearchTerm] = useState("");
  const [editManagerOpen, setEditManagerOpen] = useState(false);
  const [newManagerOpen, setNewManagerOpen] = useState(false);


  // const { data: masterData = [], isLoading } = useQuery({
  //   queryKey: ["masterData", selectedType, selectedCountry, selectedState, selectedDomain, isActiveFilter],
  //   queryFn: () => {
  //     if (!selectedType) return Promise.resolve([]);

  //     // For SUBDOMAIN, we need domainId
  //     if (selectedType === MasterTypes.SUBDOMAIN && !selectedDomain) {
  //       return Promise.resolve([]);
  //     }

  //     // Handle different parameter requirements based on selected type
  //     if (selectedType === MasterTypes.SUBDOMAIN && selectedDomain) {
  //       return dropdownApi.fetchDropdown(selectedType, {
  //         domainIds: [parseInt(selectedDomain)],
  //         isActive: isActiveFilter
  //       });
  //     } else {
  //       return dropdownApi.fetchDropdown(selectedType, {
  //         isActive: isActiveFilter
  //       });
  //     }
  //   },
  //   enabled: !!selectedType &&
  //     (selectedType === MasterTypes.SUBDOMAIN && !selectedDomain),
  // });
  const [searchText, setSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

 const {
  data: masterData,
  isLoading,
  refetch,
} = useQuery({
  queryKey: [
    "masterDataPaged",
    selectedType,
    selectedCountry,
    selectedState,
    selectedDomain,
    isActiveFilter,
    currentPage,
    pageSize,
    searchColumn,
    searchText,
  ],
  queryFn: () => {
    if (!selectedType) {
      return Promise.resolve({ items: [], totalCount: 0 });
    }

    if (selectedType === MasterTypes.SUBDOMAIN && !selectedDomain) {
      return Promise.resolve({ items: [], totalCount: 0 });
    }

    return onboarding.fetchDropdownPaged({
      masterTypeId: selectedType,
      pageNumber: currentPage,
      pageSize,
      searchColumn,
      searchText,
      sortColumns: [],
      activeStatus: isActiveFilter,
      countryId: selectedCountry ? parseInt(selectedCountry) : 0,
      stateId: selectedState ? parseInt(selectedState) : 0,
      domainId:
        selectedType === MasterTypes.SUBDOMAIN && selectedDomain
          ? parseInt(selectedDomain)
          : 0,
    });
  },
  enabled:
    !!selectedType &&
    !(selectedType === MasterTypes.SUBDOMAIN && !selectedDomain),
});



  const { data: managersList = [] } = useQuery({
    queryKey: ["managers"],
    queryFn: () => dropdownApi.fetchDropdown(75), // Type 75
  });
 
 
  

 const allMaster = masterData?.data?.items || [];
  const hasPrevious = masterData?.data.hasPrevious;
  const hasNext = masterData?.data.hasNext;
  const totalPages = masterData?.data.totalPages;
  const currentPageNumber = masterData?.data.currentPage;

  // Fetch domains for SUBDOMAIN selection
  const { data: domains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.DOMAIN),
    enabled: selectedType === MasterTypes.SUBDOMAIN,
  });

  // Update master item mutation
  const updateMasterItem = useMutation({
    mutationFn: async (data: { id: number, name: string, typeId: number, managerId?: number }) => {
      const payload = {
        id: data.id,
        isActive: true,
        masterTypeId: data.typeId,
        name: data.name,
        ...(editingItem?.stateId && { stateId: editingItem.stateId }),
        ...(editingItem?.countryId && { countryId: editingItem.countryId }),
        ...(editingItem?.domainId && { domainId: editingItem.domainId }),
        ...(data.managerId && selectedType === MasterTypes.DOMAIN && { domainManagerId: data.managerId }),
        ...(data.managerId && selectedType === MasterTypes.SUBDOMAIN && { subDomainManagerId: data.managerId }),
      };

      const response = await api.put(`/Master/${data.typeId}/${data.id}`, payload);

      if (!response.status) {
        throw new Error('Failed to update item');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["masterData", selectedType, selectedCountry, selectedState, selectedDomain, isActiveFilter] });
      setEditingItem(null);
      setEditValue("");
      setEditManagerId("");
    },
    onError: () => {
      toast.error("Failed to update item");
    }
  });

  // Add new master item mutation
  const addMasterItem = useMutation({
    mutationFn: async (data: { name: string, typeId: number, parentId?: number, managerId?: number }) => {
      const payload = {
        id: 0,
        isActive: true,
        masterTypeId: data.typeId,
        name: data.name,
        ...(selectedType === MasterTypes.SUBDOMAIN && selectedDomain && { domainId: parseInt(selectedDomain) }),
        ...(data.managerId && selectedType === MasterTypes.DOMAIN && { domainManagerId: data.managerId }),
        ...(data.managerId && selectedType === MasterTypes.SUBDOMAIN && { subDomainManagerId: data.managerId }),
      };

      const response = await api.post(`/Master/${data.typeId}`, payload);

      if (!response.status) {
        throw new Error('Failed to add item');
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Item added successfully");
      queryClient.invalidateQueries({ queryKey: ["masterData", selectedType, selectedCountry, selectedState, selectedDomain, isActiveFilter] });
      setIsAddingNew(false);
      setNewItemName("");
      setNewItemManagerId("0");
    },
    onError: () => {
      toast.error("Failed to add item");
    }
  });

  // Toggle active status mutation
  const toggleActiveStatus = useMutation({
    mutationFn: async (data: { id: number, typeId: number, currentStatus: boolean, item: MasterData }) => {
      const newStatus = !data.currentStatus;
      const response = await api.patch(`/Master/${data.typeId}/${data.id}?isActive=${newStatus}`);

      if (!response.status) {
        throw new Error('Failed to toggle status');
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      const newStatus = !variables.currentStatus;
      toast.success(`Item ${newStatus ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ["masterData", selectedType, selectedCountry, selectedState, selectedDomain, isActiveFilter] });
    },
    onError: () => {
      toast.error("Failed to toggle status");
    }
  });


  // Reset dependent selections when primary selection changes
  useEffect(() => {
    if (selectedType !== MasterTypes.SUBDOMAIN) {
      setSelectedDomain(null);
    }
    setIsAddingNew(false);
    setNewItemName("");
    setNewItemManagerId("0");
  }, [selectedType]);

  const masterTypeOptions = Object.entries(MasterTypes)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({
      label: key
        .split("_")
        .map(
          (word) => word.charAt(0)?.toUpperCase() + word.slice(1)?.toLowerCase()
        )
        .join(" "),
      value: value.toString(),
    }));

  const handleEdit = (item: MasterData) => {
    setEditingItem(item);
    setEditValue(item.name);

    // Set current manager ID if editing domain or subdomain
    if (selectedType === MasterTypes.DOMAIN && item.domainManagerName) {
      const currentManager = managersList.find((manager: any) => manager.name === item.domainManagerName);
      setEditManagerId(currentManager?.id?.toString() || "");
    } else if (selectedType === MasterTypes.SUBDOMAIN && item.subDomainManagerName) {
      const currentManager = managersList.find((manager: any) => manager.name === item.subDomainManagerName);
      setEditManagerId(currentManager?.id?.toString() || "");
    } else {
      setEditManagerId("0");
    }

    setIsAddingNew(false);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !selectedType) return;

    const payload: { id: number, name: string, typeId: number, managerId?: number } = {
      id: editingItem.id,
      name: editValue,
      typeId: selectedType,
    };

    // Add manager ID if editing domain or subdomain and a manager is selected
    if ((selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && editManagerId && editManagerId !== "0") {
      payload.managerId = parseInt(editManagerId);
    }

    updateMasterItem.mutate(payload);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
    setEditManagerId("");
  };

  const handleToggleStatus = (item: MasterData) => {
    if (!selectedType) return;

    toggleActiveStatus.mutate({
      id: item.id,
      typeId: selectedType,
      currentStatus: item.isActive,
      item: item,
    });
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(Number(value) as MasterTypes);
    setEditingItem(null);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingItem(null);
    setNewItemName("");
    setNewItemManagerId("0");
  };

  const handleSaveNew = () => {
    if (!selectedType || !newItemName.trim()) return;

    const payload: { name: string, typeId: number, parentId?: number, managerId?: number } = {
      name: newItemName,
      typeId: selectedType
    };

    // Add parent ID for hierarchical data
    if (selectedType === MasterTypes.SUBDOMAIN && selectedDomain) {
      payload.parentId = parseInt(selectedDomain);
    }

    // Add manager ID if adding domain or subdomain and a manager is selected
    if ((selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && newItemManagerId && newItemManagerId !== "0") {
      payload.managerId = parseInt(newItemManagerId);
    }

    addMasterItem.mutate(payload);
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewItemName("");
    setNewItemManagerId("0");
  };

  const canAddNew = !!selectedType &&
    !(selectedType === MasterTypes.SUBDOMAIN && !selectedDomain);

  return (
    <div className="mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Master Management
            </CardTitle>
            {/* Active/Inactive Switch */}
            <div className="flex items-center space-x-3">
              <Label htmlFor="active-switch" className="text-sm font-medium">
                Show Active
              </Label>
              <Switch
                id="active-switch"
                checked={!isActiveFilter}
                onCheckedChange={(checked) => setIsActiveFilter(!checked)}
                className="data-[state=checked]:bg-red-500"
              />
              <Label htmlFor="active-switch" className="text-sm font-medium">
                Show Inactive
              </Label>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Currently showing: <span className={`font-medium ${isActiveFilter ? 'text-green-600' : 'text-red-600'}`}>
              {isActiveFilter ? 'Active' : 'Inactive'} records
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4">
            <Select
              value={selectedType?.toString()}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select master type" />
              </SelectTrigger>
              <SelectContent>
                {masterTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show domain dropdown for SUBDOMAIN selection */}
            {selectedType === MasterTypes.SUBDOMAIN && (
              <Select
                value={selectedDomain || ""}
                onValueChange={setSelectedDomain}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain: MasterData) => (
                    <SelectItem key={domain.id} value={domain.id.toString()}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {canAddNew && isActiveFilter && (
              <Button
                variant="outline"
                className="bg-[#00A76F] text-white hover:bg-[#00A76F]/90"
                onClick={handleAddNew}
                disabled={isAddingNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.no</TableHead>
                    <TableHead>Name</TableHead>
                    {(selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && (
                      <TableHead>Manager Name</TableHead>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAddingNew && isActiveFilter && (
                    <TableRow>
                      <TableCell>New</TableCell>
                      <TableCell>
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="w-full"
                          autoFocus
                          placeholder="Enter new item name"
                        />
                        {(selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && (
                          <Popover open={newManagerOpen} onOpenChange={setNewManagerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={newManagerOpen}
                                className="w-full mt-2 justify-between"
                              >
                                {newItemManagerId === "0"
                                  ? "No Manager"
                                  : managersList.find((manager: any) => manager.id.toString() === newItemManagerId)?.name || "Select manager"
                                }
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <div className="p-2">
                                <Input
                                  placeholder="Search managers..."
                                  value={newManagerSearchTerm}
                                  onChange={(e) => setNewManagerSearchTerm(e.target.value)}
                                  className="mb-2"
                                  autoFocus
                                />
                                <div className="max-h-60 overflow-auto">
                                  {[
                                    { id: "0", name: "No Manager" },
                                    ...(Array.isArray(managersList)
                                      ? managersList.filter((manager: any) =>manager?.name?.toLowerCase().includes(editManagerSearchTerm?.toLowerCase() || "")
                                        )
                                      : [])].map((manager: any) => (
                                    <div
                                      key={manager.id}
                                      className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded"
                                      onClick={() => {
                                        setNewItemManagerId(manager.id.toString());
                                        setNewManagerOpen(false);
                                        setNewManagerSearchTerm("");
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${newItemManagerId === manager.id.toString() ? "opacity-100" : "opacity-0"
                                          }`}
                                      />
                                      {manager.name}
                                    </div>
                                  ))}
                                  {[
                                   { id: "0", name: "No Manager" },
                                   ...(Array.isArray(managersList)
                                     ? managersList.filter((manager: any) =>manager?.name?.toLowerCase().includes(editManagerSearchTerm?.toLowerCase() || "")
                                       )
                                     : [])].length === 0 && (
                                      <div className="px-2 py-1.5 text-gray-500">No managers found</div>
                                    )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                      {(selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && (
                        <TableCell>-</TableCell>
                      )}
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveNew}
                            className="text-green-600"
                            disabled={!newItemName.trim()}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelNew}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {allMaster.length === 0 && !isAddingNew ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {selectedType
                          ? selectedType === MasterTypes.SUBDOMAIN && !selectedDomain
                            ? "Please select a domain first"
                            : `No ${isActiveFilter ? 'active' : 'inactive'} data available`
                          : "Select a type to view data"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    allMaster.map((item: MasterData, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {editingItem?.id === item.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full"
                                autoFocus
                                placeholder="Enter name"
                              />
                              {(selectedType === MasterTypes.DOMAIN || selectedType === MasterTypes.SUBDOMAIN) && (
                                <Popover open={editManagerOpen} onOpenChange={setEditManagerOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={editManagerOpen}
                                      className="w-full mt-2 justify-between"
                                    >
                                      {editManagerId === "0"
                                        ? "No Manager"
                                        : managersList.find((manager: any) => manager.id.toString() === editManagerId)?.name || "Select manager"
                                      }
                                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <div className="p-2">
                                      <Input
                                        placeholder="Search managers..."
                                        value={editManagerSearchTerm}
                                        onChange={(e) => setEditManagerSearchTerm(e.target.value)}
                                        className="mb-2"
                                        autoFocus
                                      />
                                      <div className="max-h-60 overflow-auto">
                                        {[
                                        { id: "0", name: "No Manager" },
                                        ...(Array.isArray(managersList)
                                          ? managersList.filter((manager: any) =>manager?.name?.toLowerCase().includes(editManagerSearchTerm?.toLowerCase() || "")
                                            )
                                          : [])].map((manager: any) => (
                                          <div
                                            key={manager.id}
                                            className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded"
                                            onClick={() => {
                                              setEditManagerId(manager.id.toString());
                                              setEditManagerOpen(false);
                                              setEditManagerSearchTerm("");
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${editManagerId === manager.id.toString() ? "opacity-100" : "opacity-0"
                                                }`}
                                            />
                                            {manager.name}
                                          </div>
                                        ))}
                                        {[
                                           { id: "0", name: "No Manager" },
                                           ...(Array.isArray(managersList)
                                             ? managersList.filter((manager: any) =>manager?.name?.toLowerCase().includes(editManagerSearchTerm?.toLowerCase() || "")
                                               )
                                             : [])].length === 0 && (
                                            <div className="px-2 py-1.5 text-gray-500">No managers found</div>
                                          )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          ) : (
                            item.name
                          )}
                        </TableCell>
                        {selectedType === MasterTypes.DOMAIN && (
                          <TableCell>{item.domainManagerName || '-'}</TableCell>
                        )}
                        {selectedType === MasterTypes.SUBDOMAIN && (
                          <TableCell>{item.subDomainManagerName || '-'}</TableCell>
                        )}
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {editingItem?.id === item.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  title="Edit item"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(item)}
                                  className={item.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                  title={item.isActive ? "Deactivate item" : "Activate item"}
                                >
                                  {item.isActive ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
          <div className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-500">
                  Page {currentPageNumber} of {totalPages}
                </div>
                <Pagination
                  value={pageSize}
                  totalEntry={masterData?.data?.totalCount}
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
      </Card>
       </div>
  );
}
