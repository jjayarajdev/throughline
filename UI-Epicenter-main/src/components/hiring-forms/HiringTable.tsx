"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Ban,
  Check,
  ChevronDown,
  Columns4,
  Download,
  Menu,
  PlusIcon,

} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {  ListFilter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";



export type Order = {
  id: number;
  business: string;
  apexid: string;
  rrid: string;
  project: string;
  requester: string;
  position: string;
  projectName: string;
  hrq_id: string;
  req_date: string;
  status: string;
  owner: string;
};

const data: Order[] = [
  {
    id: 1,
    business: "RPS",
    apexid: "WWW_221011_6053",
    rrid: "38991	",
    project: "LIC & J&J Phase 9, Gain Y3",
    requester: "Anand Chetri",
    position: "Hiring Manager",
    projectName: "Agency Website",
    hrq_id: "HRQ1234",
    req_date: "25-04-2025",
    status: "Active",
    owner: "Harika Samireddypalli",
  },
  {
    id: 2,
    business: "RPS",
    apexid: "WWW_221011_6053",
    rrid: "38991	",
    project: "LIC & J&J Phase 9, Gain Y3",
    requester: "Anand Chetri",
    position: "Hiring Manager",
    projectName: "Agency Website",
    hrq_id: "HRQ4313",
    req_date: "25-04-2025",
    status: "New",
    owner: "Harika Samireddypalli",
  },
  {
    id: 3,
    business: "RPS",
    apexid: "WWW_221011_6053",
    rrid: "38991	",
    project: "LIC & J&J Phase 9, Gain Y3",
    requester: "Anand Chetri",
    position: "Hiring Manager",
    projectName: "Agency Website",
    hrq_id: "HRQ32332",
    req_date: "25-04-2025",
    status: "Open-WIP",
    owner: "Harika Samireddypalli",
  },
];

export const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "hrq_id",
    header: "HRQ ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("hrq_id")}</div>
    ),
  },
  {
    accessorKey: "business",
    header: "Business",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("business")}</div>
    ),
  },
  {
    accessorKey: "apexid",
    header: "APEX ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("apexid")}</div>
    ),
  },
  {
    accessorKey: "rrid",
    header: "RR ID",
    cell: ({ row }) => <div className="capitalize">{row.getValue("rrid")}</div>,
  },
  {
    accessorKey: "project",
    header: "Project",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("project")}</div>
    ),
  },
  {
    accessorKey: "requester",
    header: "Requester",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("requester")}</div>
    ),
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("position")}</div>
    ),
  },

  {
    accessorKey: "req_date",
    header: "Request Start Date",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("req_date")}</div>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },

  {
    accessorKey: "owner",
    header: "Approver",
    cell: ({ row }) => <div>{row.getValue("owner")}</div>,
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const order = row.original;
      const router = useRouter();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-8  p-2">
              {/* <span className="sr-only">Open menu</span> */}
              <Menu />
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-dark">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Separator />
            <DropdownMenuItem
              onClick={() => router.push(`/home/hiring-management/${12}/${"approve"}` )}
             >
            <Check className="h-4 w-4 text-green-600" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem>
            <Ban  className="h-5 w-5 text-red-600"/>
              Reject
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function HireTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    enableRowSelection:true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const router = useRouter();

  const [position, setPosition] = React.useState("hrq_id");

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex items-center  gap-2">
          <div className="flex items-center  gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {position
                    .split("_")
                    .map((word) => word.toUpperCase())
                    .join(" ")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={position}
                  onValueChange={setPosition}
                >
                  <DropdownMenuRadioItem value="hrq_id">
                    HRQ ID
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="apex_id">
                    APEX ID
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rr_id">
                    {" "}
                    RR ID
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-2">
            <Input placeholder="38991" defaultValue={2343} className="w-48" />
          </div>
          <div className="space-y-2">
            <Button className="bg-[#00B188]">Search</Button>
          </div>
        </div>

        <div className="flex items-center py-4 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className=" text-[#007E61]">
                <div className="rotate-90">
                  <Columns4 />
                </div>
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" className="text-[#007E61]">
            <ListFilter /> Add Filter
          </Button>
          <Button
            variant="ghost"
            className="text-[#007E61]"
            onClick={() => router.push(`/home/hiring-management/${12}/${"create-hiring"}` )}
          >
            <PlusIcon /> Create
          </Button>
          <Button variant="ghost" className="text-[#007E61]">
            <Download /> Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
