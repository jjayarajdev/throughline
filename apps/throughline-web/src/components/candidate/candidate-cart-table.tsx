"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Result, Select, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/lib/toast";
import api from "@/lib/axiosInstance";
import { candidateApi } from "@/services/api/candidate.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { formatDate } from "@/helpers/helper";
import { isAdmin, isRmowner, isVendorManager, useUserStore } from "@/store/userStore";
import { ResumePreview } from "./ResumePreview";

type Candidate = Record<string, any>;

/** Approved candidates ("cart") grid — the main candidate list. */
export function CandidateCartTable() {
  const router = useRouter();
  const partnerId = useUserStore((state) => state.partnerId) || "";

  const t = useTableState({ pageSize: 50, sortBy: "profileCreatedAt", sortOrder: "desc", searchColumn: "CandidateCode" });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateManagement);
  const [statusId, setStatusId] = useState<number[]>([15002]);

  const { data: CANDIDATE_INTAKE_STATUS = [] } = useQuery({
    queryKey: ["CANDIDATE_INTAKE_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
    select: (data: { id: number; name: string }[]) => data.filter((item) => item.id !== 15001),
  });

  const { data: candidatesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["candidatesCart", t.query, t.sortColumns, statusId],
    queryFn: () =>
      candidateApi.fetchCandidateList(
        {
          pageNumber: t.query.pageNumber,
          pageSize: t.query.pageSize,
          searchColumn: t.query.searchColumn,
          searchText: t.query.searchText,
          sortColumns: t.sortColumns,
        },
        false,
        Number(partnerId),
        statusId
      ),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled: !!statusId,
  });

  const candidates: Candidate[] = candidatesResponse?.data?.items || [];

  const { mutate: exportExcel, isPending: exporting } = useMutation({
    mutationFn: downloadExcel,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidate-list.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Download failed");
      console.error("Download failed:", err);
    },
  });

  const columns = useMemo<DataColumn<Candidate>[]>(
    () => [
      {
        key: "candidateCode",
        title: "Candidate Code",
        dataIndex: "candidateCode",
        sorter: true,
        fixed: "left",
        render: (v: string) => (
          <Typography.Link onClick={() => router.push(`/home/candidate-management/candidate-profile?id=${v}`)}>{v}</Typography.Link>
        ),
      },
      { key: "fullName", title: "Candidate Name", dataIndex: "fullName" },
      { key: "email", title: "Candidate Email", dataIndex: "email" },
      { key: "phoneNumber", title: "Candidate Contact", dataIndex: "phoneNumber" },
      { key: "profileCreatedAt", title: "Created Date", dataIndex: "profileCreatedAt", sorter: true, render: (v: string) => formatDate(v) },
      {
        key: "jobTitle",
        title: "Role Hired For",
        dataIndex: "jobTitle",
        render: (v: string) => v?.split(",").map((title, i) => <div key={i}>{title.trim()}</div>),
      },
      { key: "relevantExperience", title: "Experience", dataIndex: "relevantExperience", sorter: true },
      {
        key: "resume",
        title: "Resume",
        dataIndex: "resume",
        render: (_: unknown, c: Candidate) =>
          c.resume?.attachmentURL ? (
            <ResumePreview url={c.resume.attachmentURL} fileName={`${c.fullName}'s Resume`} />
          ) : (
            <Typography.Text type="secondary">No resume</Typography.Text>
          ),
      },
      { key: "nickname", title: "Partner", dataIndex: "nickname" },
      { key: "acknowledged", title: "Acknowledged", dataIndex: "isAgreedForTermsConditions", render: (v: boolean) => (v ? "Yes" : "No") },
      { key: "intakeStatusName", title: "Status", dataIndex: "intakeStatusName", render: (v: string) => <StatusBadge status={v} /> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (error)
    return (
      <Result
        status="error"
        title="Could not load candidates"
        subTitle={(error as any)?.response?.data?.message || (error as Error).message}
        extra={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );

  return (
    <DataTable<Candidate>
      storageKey="candidate-cart"
      rowKey="id"
      columns={columns}
      data={candidates}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: candidatesResponse?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search candidates" }}
      filters={
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Choose status"
          style={{ minWidth: 220 }}
          value={statusId}
          options={CANDIDATE_INTAKE_STATUS.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => {
            setStatusId(v);
            t.resetPage();
          }}
        />
      }
      onExport={
        isAdmin || isRmowner || isVendorManager
          ? () => {
              if (!candidates.length) return;
              exportExcel({ statusId, partnerId: partnerId ? Number(partnerId) : undefined, sortColumns: t.sortColumns });
            }
          : undefined
      }
      exporting={exporting}
      actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/home/candidate-management/create-candidate")}>
          Create
        </Button>
      }
      emptyText="No candidates found"
    />
  );
}

async function downloadExcel({
  isBin = false,
  statusId = [],
  partnerId,
  sortColumns = [],
}: {
  isBin?: boolean;
  statusId?: number[];
  partnerId?: number;
  sortColumns?: { column: string; descending: boolean }[];
}) {
  const query = new URLSearchParams({ isBin: String(isBin) });
  if (partnerId) query.append("partnerId", String(partnerId));
  if (statusId && statusId.length > 0) query.append("intakeStatusId", statusId.join(","));
  const response = await api.post(`/CandidateForm/download-all-excel?${query.toString()}`, { sortColumns }, { responseType: "blob", headers: { accept: "*/*" } });
  return response.data as Blob;
}
