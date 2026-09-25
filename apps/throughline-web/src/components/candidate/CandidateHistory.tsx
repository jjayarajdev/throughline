"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Result, Select, Typography } from "antd";

import DataTable, { type DataColumn } from "@/components/data-table/DataTable";
import { useTableState } from "@/components/data-table/useTableState";
import { useSearchColumns } from "@/components/data-table/useSearchColumns";
import { StatusBadge } from "@/components/status-badge";
import { candidateApi } from "@/services/api/candidate.api";
import { dropdownApi } from "@/services/api/master";
import { MasterTypes } from "@/constants/masterTypes";
import { FilterTypeEnum } from "@/constants/FilterTypeEnum";
import { ResumePreview } from "./ResumePreview";

type Candidate = Record<string, any>;

/** All candidates by intake status (history view). */
export function CandidateHistory() {
  const router = useRouter();
  const t = useTableState({ pageSize: 50, searchColumn: "HrqId" });
  const searchColumns = useSearchColumns(FilterTypeEnum.CandidateManagement);
  const [statusId, setStatusId] = useState<number | undefined>(undefined);

  const { data: CANDIDATE_INTAKE_STATUS = [] } = useQuery({
    queryKey: ["CANDIDATE_INTAKE_STATUS"],
    queryFn: () => dropdownApi.fetchDropdown(MasterTypes.CANDIDATE_INTAKE_STATUS),
    select: (data: { id: number; name: string }[]) => [...data.filter((item) => item.id !== 15001), { masterTypeId: 0, name: "All", id: 1, isActive: true }],
  });

  // the legacy dropdown auto-selected its first option
  useEffect(() => {
    if (statusId === undefined && CANDIDATE_INTAKE_STATUS.length) setStatusId(CANDIDATE_INTAKE_STATUS[0].id);
  }, [CANDIDATE_INTAKE_STATUS, statusId]);

  const { data: candidatesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ["candidatesHistory", t.query, statusId],
    queryFn: () =>
      candidateApi.fetchBinCandidateHistory(
        { pageNumber: t.query.pageNumber, pageSize: t.query.pageSize, searchColumn: t.query.searchColumn, searchText: t.query.searchText },
        statusId
      ),
    enabled: !!statusId,
    refetchOnWindowFocus: true,
  });

  const columns = useMemo<DataColumn<Candidate>[]>(
    () => [
      {
        key: "hrqId",
        title: "HRQID",
        dataIndex: "hrqId",
        fixed: "left",
        render: (v: string) => <Typography.Link onClick={() => router.push(`/home/hiring-details?hrqid=${v}`)}>{v}</Typography.Link>,
      },
      { key: "candidateCode", title: "Candidate Code", dataIndex: "candidateCode" },
      { key: "fullName", title: "Candidate Name", dataIndex: "fullName", sorter: (a, b) => String(a.fullName ?? "").localeCompare(String(b.fullName ?? "")) },
      { key: "email", title: "Candidate Email", dataIndex: "email" },
      { key: "phoneNumber", title: "Candidate Contact", dataIndex: "phoneNumber" },
      {
        key: "jobTitle",
        title: "Role Hired For",
        dataIndex: "jobTitle",
        render: (v: string) => v?.split(",").map((title, i) => <div key={i}>{title.trim()}</div>),
      },
      {
        key: "relevantExperience",
        title: "Experience",
        dataIndex: "relevantExperience",
        sorter: (a, b) => Number(a.relevantExperience ?? 0) - Number(b.relevantExperience ?? 0),
      },
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
      { key: "nickName", title: "Partner", dataIndex: "nickName" },
      { key: "acknowledged", title: "Acknowledged", dataIndex: "isAgreedForTermsConditions", render: (v: boolean) => (v ? "Yes" : "No") },
      { key: "intakeStatusName", title: "Intake Status", dataIndex: "intakeStatusName", render: (v: string) => <StatusBadge status={v} /> },
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
      storageKey="candidate-history"
      rowKey="id"
      columns={columns}
      data={candidatesResponse?.data?.items || []}
      loading={isLoading}
      pagination={{ current: t.pageNumber, pageSize: t.pageSize, total: candidatesResponse?.data?.totalCount ?? 0 }}
      onChange={t.onTableChange}
      search={{ columns: searchColumns, column: t.searchColumn, text: t.searchText, onChange: t.setSearch, placeholder: "Search candidates" }}
      filters={
        <Select
          placeholder="Status"
          style={{ minWidth: 180 }}
          value={statusId}
          options={CANDIDATE_INTAKE_STATUS.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(v) => {
            setStatusId(v);
            t.resetPage();
          }}
          popupMatchSelectWidth={false}
        />
      }
      emptyText="No candidates found"
    />
  );
}
