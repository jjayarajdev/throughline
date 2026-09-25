"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Alert, Button, Card, Flex, Space, Table, Tag, theme, Typography, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckCircleOutlined, DownloadOutlined, ExclamationCircleOutlined, FileExcelOutlined, UploadOutlined } from "@ant-design/icons";
import api from "@/lib/axiosInstance";
import { toast } from "@/lib/toast";
import { useUserStore } from "@/store/userStore";

// Helper function to convert Excel serial date to yyyy-mm-dd format
const convertExcelDate = (excelDate: any): string | null => {
  if (!excelDate) return null;

  if (typeof excelDate === "string") {
    const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
    if (dateRegex.test(excelDate)) return excelDate;
  }

  if (typeof excelDate === "number") {
    try {
      // Excel's epoch starts from January 1, 1900, and treats 1900 as a leap year
      const excelEpoch = new Date(1900, 0, 1);
      const daysToAdd = excelDate - 2;
      const resultDate = new Date(excelEpoch.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      const year = resultDate.getFullYear();
      const month = String(resultDate.getMonth() + 1).padStart(2, "0");
      const day = String(resultDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error converting Excel date:", error);
      return null;
    }
  }

  try {
    const date = new Date(excelDate);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error("Error parsing date:", error);
  }

  return null;
};

const transformExcelData = (data: any[]) =>
  data.map((row) => ({
    cityName: row["Current City"] || "",
    countryName: row["Current Country"] || "",
    currentlyWorking: row["Currently Working(Yes/No)*"] || "",
    diversity: row["Diversity(Yes Anything/No means Male)*"] || "",
    email: row["Email*"].trim() || "",
    fullName: row["Full Name(Name As Per Aadhar)*"] || "",
    hrqId: row["HRQID"] || "",
    lastWorkingDay: convertExcelDate(row["Last Working Day * (mm-dd-yyyy)"]),
    noticePeriod: row["Notice Period (Days)*"] || 0,
    currentOrganisation: row["Organisation*"] || "",
    phoneNumber: row["Phone/ Mobile Number*"].toString() || "",
    partnerCode: row["PartnerID*"] || "",
    relevantExperience: row["Relevant Experience (Years)*"] || 0,
    primarySkillNames: (row["Primary Skills(Use Comma to separate the Skills)"] || "")
      .split(",")
      .map((skill: string) => skill.trim())
      .filter((skill: string) => skill !== ""),
    secondarySkillNames: (row["Secondary Skills(Use Comma to separate the Skills)"] || "")
      .split(",")
      .map((skill: string) => skill.trim())
      .filter((skill: string) => skill !== ""),
    stateName: row["Current State"] || "",
    roleHiredFor: row["Role Hired For"] || "",
    preferredWorkLocationNames: (row["Work Location"] || "")
      .split(",")
      .map((loc: string) => loc.trim())
      .filter((loc: string) => loc !== ""),
    isActive: true,
  }));

interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
  value: any;
}

const validatePhoneNumber = (phone: string): boolean => phone.replace(/\D/g, "").length === 10;
const validateEmail = (email: string): boolean => email.includes("@") && email.includes(".");
const validateDate = (dateString: string | null): boolean => {
  if (!dateString) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split("-").map((p) => parseInt(p));
  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const performFrontendValidation = (data: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  data.forEach((row, index) => {
    if (!validatePhoneNumber(row.phoneNumber)) {
      errors.push({ rowIndex: index, field: "phoneNumber", message: "Phone number must be exactly 10 digits", value: row.phoneNumber });
    }
    if (!validateEmail(row.email.trim())) {
      errors.push({ rowIndex: index, field: "email", message: "Email must contain @ symbol", value: row.email });
    }
    if (row.lastWorkingDay && !validateDate(row.lastWorkingDay)) {
      errors.push({ rowIndex: index, field: "lastWorkingDay", message: "Last Working Day must be in YYYY-MM-DD format", value: row.lastWorkingDay });
    }
    const requiredFields = [
      { field: "fullName", label: "Full Name" },
      { field: "email", label: "Email" },
      { field: "phoneNumber", label: "Phone Number" },
      { field: "hrqId", label: "HRQID" },
      { field: "partnerCode", label: "PartnerId" },
      { field: "cityName", label: "City" },
      { field: "countryName", label: "Country" },
      { field: "stateName", label: "State" },
    ];
    requiredFields.forEach(({ field, label }) => {
      if (!row[field] || row[field].toString().trim() === "") {
        errors.push({ rowIndex: index, field, message: `${label} is required`, value: row[field] });
      }
    });
  });
  return errors;
};

const prepareDataForAPI = (data: any[]) =>
  data.map((row) => ({ ...row, lastWorkingDay: row.lastWorkingDay && validateDate(row.lastWorkingDay) ? row.lastWorkingDay : null }));

/** Bulk candidate registration from the Excel template: load → validate (client + API) → submit. */
const UploadMultipleCandidate = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const { userId } = useUserStore();
  const [excelData, setExcelData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiValidationError, setApiValidationError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateData = async () => {
    if (excelData.length === 0) {
      toast.error("Please upload an Excel file first");
      return;
    }
    setIsValidating(true);
    setValidationErrors([]);
    setApiValidationError("");
    setIsValidated(false);
    setIsSubmitEnabled(false);

    try {
      const frontendErrors = performFrontendValidation(excelData);
      if (frontendErrors.length > 0) {
        setValidationErrors(frontendErrors);
        setIsValidating(false);
        toast.error(`Found ${frontendErrors.length} validation errors. Please fix them before proceeding.`);
        return;
      }
      const apiData = prepareDataForAPI(excelData);
      const response = await api.post(`/CandidateBin/bulk/validate?userId=${userId}`, apiData);
      toast.success(response?.data?.message || "All data validated successfully!", {
        description: `Successfully validated ${excelData.length} candidate records.`,
      });
      setIsValidated(true);
      setIsSubmitEnabled(true);
    } catch (error: any) {
      console.error("Validation error:", error);
      if (error.response?.data?.message) {
        setApiValidationError(error.response.data.message);
        toast.error("API validation failed");
      } else {
        toast.error("Validation failed. Please try again.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setExcelData([]);
    setIsSubmitEnabled(false);
    setIsValidated(false);
    setValidationErrors([]);
    setApiValidationError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "", blankrows: false }) as Record<string, any>[];

      if (rawData.length > 0) {
        const cleanedData = rawData.map((row) =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim?.() ?? k, typeof v === "string" ? v.trim() : v]))
        );
        setHeaders(Object.keys(cleanedData[0] as object));
        setOriginalData(cleanedData);
        setExcelData(transformExcelData(cleanedData));
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/candidate-template.xlsx";
    link.download = "candidate-template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded successfully");
  };

  const submitCandidates = async () => {
    setSubmitting(true);
    if (!isValidated) {
      toast.error("Please validate the data first");
      setSubmitting(false);
      return;
    }
    try {
      const apiData = prepareDataForAPI(excelData);
      await api.post(`/CandidateBin/bulk/${userId}`, apiData);
      toast.success("Successfully created candidates");
      router.push("/home/candidate-management");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error while submitting candidates");
    } finally {
      setSubmitting(false);
    }
  };

  const hasRowErrors = (rowIndex: number) => validationErrors.some((error) => error.rowIndex === rowIndex);

  const formatDisplayValue = (header: string, value: any): React.ReactNode => {
    if (header === "Last Working Day * (mm-dd-yyyy)") {
      const convertedValue = convertExcelDate(value);
      if (typeof value === "number") {
        return (
          <Space orientation="vertical" size={0}>
            <Typography.Text type="secondary">Original: {value}</Typography.Text>
            <Typography.Text type="success">Converted: {convertedValue || "Invalid"}</Typography.Text>
          </Space>
        );
      }
      return convertedValue || value;
    }
    return value;
  };

  const previewColumns: ColumnsType<any> = [
    {
      key: "#",
      title: "#",
      width: 64,
      fixed: "left",
      render: (_: unknown, __: unknown, index: number) => (
        <Space size={4}>
          {index + 1}
          {hasRowErrors(index) && <ExclamationCircleOutlined style={{ color: token.colorError }} />}
        </Space>
      ),
    },
    ...headers.map((header) => ({
      key: header,
      title: header,
      dataIndex: header,
      ellipsis: true,
      width: 180,
      render: (v: any) => formatDisplayValue(header, v),
    })),
  ];

  return (
    <Flex vertical gap={16}>
      <Card
        title={
          <Space>
            <FileExcelOutlined />
            Upload Multiple Candidates
          </Space>
        }
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            Download Template
          </Button>
        }
      >
        <Flex wrap gap={16} align="center">
          <Upload accept=".xlsx, .xls" showUploadList={false} beforeUpload={handleFileUpload} maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Excel File</Button>
          </Upload>
          {excelData.length > 0 && (
            <Button type={isValidated ? "primary" : "default"} icon={<CheckCircleOutlined />} loading={isValidating} onClick={validateData}>
              {isValidating ? "Validating..." : "Validate Data"}
            </Button>
          )}
          <Space>
            <Typography.Text type="secondary">{excelData.length > 0 ? `${excelData.length} rows loaded` : "No file selected"}</Typography.Text>
            {isValidated && (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Validated
              </Tag>
            )}
          </Space>
        </Flex>

        {validationErrors.length > 0 && (
          <Alert
            className="mt-4"
            type="error"
            showIcon
            message={`Found ${validationErrors.length} validation errors:`}
            description={
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {validationErrors.map((error, index) => (
                  <div key={index}>
                    <Typography.Text strong>Row {error.rowIndex + 1}</Typography.Text> - {error.field}: {error.message}
                    {error.value && <Typography.Text type="secondary"> (Value: &quot;{error.value}&quot;)</Typography.Text>}
                  </div>
                ))}
              </div>
            }
          />
        )}

        {apiValidationError && (
          <Alert className="mt-4" type="error" showIcon message="Excel Data error:" description={<div style={{ whiteSpace: "pre-line" }}>{apiValidationError}</div>} />
        )}

        {excelData.length > 0 && (
          <Alert
            className="mt-4"
            type="info"
            showIcon
            message="Date Conversion Notice:"
            description={
              <>
                Excel date values (like 45365) are automatically converted to <strong>YYYY-MM-DD</strong> format. Check the preview table to verify the
                converted dates are correct.
              </>
            }
          />
        )}
      </Card>

      {excelData.length > 0 && (
        <Card title="Data Preview">
          <Table
            size="small"
            rowKey={(_, i) => String(i)}
            columns={previewColumns}
            dataSource={originalData}
            pagination={false}
            scroll={{ x: "max-content" }}
            onRow={(_, index) => (index !== undefined && hasRowErrors(index) ? { style: { background: token.colorErrorBg } } : {})}
          />
          <Typography.Text type="secondary" className="block text-center mt-2">
            Scroll horizontally to view all columns
          </Typography.Text>
        </Card>
      )}

      <Flex justify="flex-end">
        <Button type="primary" onClick={submitCandidates} disabled={!isSubmitEnabled} loading={submitting}>
          Submit Candidates
        </Button>
      </Flex>
    </Flex>
  );
};

export default UploadMultipleCandidate;
