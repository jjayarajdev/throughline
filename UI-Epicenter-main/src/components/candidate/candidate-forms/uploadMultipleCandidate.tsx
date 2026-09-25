'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import api from '@/lib/axiosInstance'
import { AlertCircle, CheckCircle, FileSpreadsheet, Upload, Loader2, Download } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserStore } from '@/store/userStore'
import { useRouter } from 'next/navigation'
import { fi } from 'zod/v4/locales'

// Helper function to convert Excel serial date to yyyy-mm-dd format
const convertExcelDate = (excelDate: any): string | null => {
    if (!excelDate) return null;

    // If it's already a string that looks like a date, return it
    if (typeof excelDate === 'string') {
        // Check if it's already in a valid date format
        const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
        if (dateRegex.test(excelDate)) {
            return excelDate;
        }
    }

    // If it's a number (Excel serial date)
    if (typeof excelDate === 'number') {
        try {
            // Excel's epoch starts from January 1, 1900
            // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
            const excelEpoch = new Date(1900, 0, 1);
            const daysToAdd = excelDate - 2; // Subtract 2 to account for Excel's leap year bug
            const resultDate = new Date(excelEpoch.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

            // Format as YYYY-MM-DD (year-month-day)
            const year = resultDate.getFullYear();
            const month = String(resultDate.getMonth() + 1).padStart(2, '0');
            const day = String(resultDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Error converting Excel date:', error);
            return null;
        }
    }

    // Try to parse as Date object
    try {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (error) {
        console.error('Error parsing date:', error);
    }

    return null;
};

const transformExcelData = (data: any[]) => {
    return data.map(row => ({
        cityName: row['Current City'] || '',
        countryName: row['Current Country'] || '',
        currentlyWorking: row['Currently Working(Yes/No)*'] || '',
        diversity: row['Diversity(Yes Anything/No means Male)*'] || '',
        email: row['Email*'].trim() || '',
        fullName: row['Full Name(Name As Per Aadhar)*'] || '',
        hrqId: row['HRQID'] || '',
        lastWorkingDay: convertExcelDate(row['Last Working Day * (mm-dd-yyyy)']),
        noticePeriod: row['Notice Period (Days)*'] || 0,
        currentOrganisation: row['Organisation*'] || '',
        phoneNumber: row['Phone/ Mobile Number*'].toString() || '',
        partnerCode: row['PartnerID*'] || '',
        relevantExperience: row['Relevant Experience (Years)*'] || 0,
        primarySkillNames: (row['Primary Skills(Use Comma to separate the Skills)'] || '').split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill !== ''),
        secondarySkillNames: (row['Secondary Skills(Use Comma to separate the Skills)'] || '').split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill !== ''),
        stateName: row['Current State'] || '',
        roleHiredFor: row['Role Hired For'] || '',
         preferredWorkLocationNames: (row['Work Location'] || '')
        .split(',')
        .map((loc: string) => loc.trim())
        .filter((loc: string) => loc !== ''),
        isActive: true,
    }));
};

interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
    value: any;
}

const UploadMultipleCandidate = () => {
    const [fileInputKey, setFileInputKey] = useState(0);
    const [excelData, setExcelData] = useState<any[]>([]);
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [apiValidationError, setApiValidationError] = useState<string>('');
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
    const { partnerId, userId } = useUserStore()
    const router = useRouter()

    // Frontend validation functions
    const validatePhoneNumber = (phone: string): boolean => {
        const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
        return cleanPhone.length === 10;
    };

    const validateEmail = (email: string): boolean => {
        return email.includes('@') && email.includes('.');
    };

    const validateDate = (dateString: string | null): boolean => {
        if (!dateString) return true; // Date is optional

        // Check if it's in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) return false;

        // Parse the YYYY-MM-DD format to validate it's a real date
        const parts = dateString.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);

        // Create date object with month-1 since JS months are 0-indexed
        const date = new Date(year, month - 1, day);

        // Check if the date is valid and matches our input
        return !isNaN(date.getTime()) &&
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day;
    };

    const performFrontendValidation = (data: any[]): ValidationError[] => {
        const errors: ValidationError[] = [];

        data.forEach((row, index) => {
            // Validate phone number
            if (!validatePhoneNumber(row.phoneNumber)) {
                errors.push({
                    rowIndex: index,
                    field: 'phoneNumber',
                    message: 'Phone number must be exactly 10 digits',
                    value: row.phoneNumber
                });
            }

            // Validate email
            if (!validateEmail(row.email.trim())) {
                errors.push({
                    rowIndex: index,
                    field: 'email',
                    message: 'Email must contain @ symbol',
                    value: row.email
                });
            }

            // Validate last working day date format
            if (row.lastWorkingDay && !validateDate(row.lastWorkingDay)) {
                errors.push({
                    rowIndex: index,
                    field: 'lastWorkingDay',
                    message: 'Last Working Day must be in YYYY-MM-DD format',
                    value: row.lastWorkingDay
                });
            }

            // Validate required fields
            const requiredFields = [
                { field: 'fullName', label: 'Full Name' },
                { field: 'email', label: 'Email' },
                { field: 'phoneNumber', label: 'Phone Number' },
                { field: 'hrqId', label: 'HRQID' },
                { field: 'partnerCode', label: 'PartnerId' },
                { field: 'cityName', label: 'City' },
                { field: 'countryName', label: 'Country' },
                { field: 'stateName', label: 'State' }
            ];

            requiredFields.forEach(({ field, label }) => {
                if (!row[field] || row[field].toString().trim() === '') {
                    errors.push({
                        rowIndex: index,
                        field,
                        message: `${label} is required`,
                        value: row[field]
                    });
                }
            });
        });

        return errors;
    };

    // Helper function to ensure date is in YYYY-MM-DD format for API calls
    const prepareDataForAPI = (data: any[]) => {
        return data.map(row => ({
            ...row,
            // Ensure lastWorkingDay is in YYYY-MM-DD format or null
            lastWorkingDay: row.lastWorkingDay && validateDate(row.lastWorkingDay)
                ? row.lastWorkingDay
                : null
        }));
    };

    const validateData = async () => {
        if (excelData.length === 0) {
            toast.error('Please upload an Excel file first');
            return;
        }
        setIsValidating(true);
        setValidationErrors([]);
        setApiValidationError('');
        setIsValidated(false);
        setIsSubmitEnabled(false);

        try {
            // Step 1: Frontend validation
            const frontendErrors = performFrontendValidation(excelData);

            if (frontendErrors.length > 0) {
                setValidationErrors(frontendErrors);
                setIsValidating(false);
                toast.error(`Found ${frontendErrors.length} validation errors. Please fix them before proceeding.`);
                return;
            }

            // Step 2: API validation with properly formatted data
            const apiData = prepareDataForAPI(excelData);
            const response = await api.post(`/CandidateBin/bulk/validate?userId=${userId}`, apiData);
             toast.success( response?.data?.message || 'All data validated successfully!',{
                description: `Successfully validated ${excelData.length} candidate records.`
             } )
            // If we reach here, validation passed
            setIsValidated(true);
            setIsSubmitEnabled(true);
            // toast.success('All data validated successfully!', {
            //     description: `Successfully validated ${excelData.length} candidate records.`
            // });

        } catch (error: any) {
            console.error('Validation error:', error);
            if (error.response?.data?.message) {
                setApiValidationError(error.response.data.message);
                toast.error('API validation failed');
            } else {
                toast.error('Validation failed. Please try again.');
            }
        } finally {
            setIsValidating(false);
        }
    };

 const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExcelData([]);
    setIsSubmitEnabled(false);
    setFileInputKey(prev => prev + 1);
    setIsValidated(false);
    setValidationErrors([]);
    setApiValidationError('');

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;

        // FIX: use "array" for ArrayBuffer
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Ensure empty cells become ""
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "",      
            blankrows: false,
 });

        if (rawData.length > 0) {
            // Trim headers & string values
            const cleanedData = rawData.map(row =>
                Object.fromEntries(
                    Object.entries(row).map(([k, v]) => [
                        k.trim?.() ?? k,
                        typeof v === "string" ? v.trim() : v
                    ])
                )
            );

            const transformedData = transformExcelData(cleanedData);

            setHeaders(Object.keys(cleanedData[0] as object));
            setOriginalData(cleanedData);
            setExcelData(transformedData);
            // validateData()
            // toast.success(`Loaded ${cleanedData.length} records from Excel file`);
        }
    };

    // Read as ArrayBuffer so we can use type: "array"
    reader.readAsArrayBuffer(file);
};


    const handleDownloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/candidate-template.xlsx';
        link.download = 'candidate-template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Template downloaded successfully');
    };
const [submitting, setSubmitting] = useState(false);
    const submitCandidates = async () => {
        setSubmitting(true);
        if (!isValidated) {
            toast.error('Please validate the data first');
            return;
        }

        try {
            // Prepare data with proper date formatting for submit API
            const apiData = prepareDataForAPI(excelData);
            const res = await api.post(`/CandidateBin/bulk/${userId}`, apiData);
            toast.success("Successfully created candidates");
            router.push('/home/candidate-management');
        } catch (error) {
            toast.error(error?.response?.data?.message || "Error while submitting candidates");
        }finally {
            setSubmitting(false);
        }
    };

    const getRowErrors = (rowIndex: number) => {
        return validationErrors.filter(error => error.rowIndex === rowIndex);
    };

    const hasRowErrors = (rowIndex: number) => {
        return validationErrors.some(error => error.rowIndex === rowIndex);
    };

    // Helper function to display dates properly in the table
    const formatDisplayValue = (header: string, value: any) => {
        if (header === 'Last Working Day * (mm-dd-yyyy)') {
            // For date fields, show the converted value in YYYY-MM-DD format
            const convertedValue = convertExcelDate(value);

            if (typeof value === 'number') {
                return (
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500">Original: {value}</div>
                        <div className="font-medium text-green-600">
                            Converted: {convertedValue || 'Invalid'}
                        </div>
                    </div>
                );
            }
            return convertedValue || value;
        }
        return value;
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-6 w-6" />
                            Upload Multiple Candidates
                        </CardTitle>
                        <Button
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                        <Button variant="outline" className="relative">
                            <Input
                                key={fileInputKey}
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Excel File
                        </Button>

                        {excelData.length > 0 && (<>
                            <Button
                                onClick={validateData}
                                disabled={isValidating}
                                variant={isValidated ? "hpButton" : "hpPending"}
                                className="flex items-center gap-2 w-auto"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Validate Data
                                    </>
                                )}
                            </Button>
                        </>)}

                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                {excelData.length > 0
                                    ? `${excelData.length} rows loaded`
                                    : "No file selected"}
                            </p>
                            {isValidated && (
                                <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Validated</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Frontend Validation Errors */}
                    {validationErrors.length > 0 && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium mb-2">
                                    Found {validationErrors.length} validation errors:
                                </div>
                                <div className="max-h-40 w-1/2 overflow-y-auto space-y-1">
                                    {validationErrors.map((error, index) => (
                                        <div key={index} className="text-sm">
                                            <strong>Row {error.rowIndex + 1}</strong> - {error.field}: {error.message}
                                            {error.value && <span className="ml-1 text-xs opacity-75">(Value: "{error.value}")</span>}
                                        </div>
                                    ))}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* API Validation Error */}
                    {apiValidationError && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium mb-2">
                                    Excel Data error:
                                </div>
                                <div className="text-sm whitespace-pre-line">
                                    {apiValidationError}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Date Conversion Info */}
                    {excelData.length > 0 && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="font-medium mb-2">
                                    Date Conversion Notice:
                                </div>
                                <div className="text-sm">
                                    Excel date values (like 45365) are automatically converted to <strong>YYYY-MM-DD</strong> format.
                                    Check the preview table to verify the converted dates are correct.
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {excelData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Data Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Scrollable container with fixed height and horizontal scroll */}
                        <div className="w-full overflow-x-auto border rounded-lg">
                            <div className="min-w-max">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-16 sticky left-0 bg-background z-10 border-r">#</TableHead>
                                            {headers.map((header) => (
                                                <TableHead key={header} className="min-w-[150px] whitespace-nowrap px-4">
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {originalData.map((row, index) => (
                                            <TableRow
                                                key={index}
                                                className={hasRowErrors(index) ? 'bg-destructive/10 hover:bg-destructive/20 border-destructive/20 hover:cursor-pointer' : ''}
                                            >
                                                <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                                    <div className="flex items-center gap-2">
                                                        {index + 1}
                                                        {hasRowErrors(index) && (
                                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {headers.map((header) => (
                                                    <TableCell key={`${index}-${header}`} className="min-w-[150px] px-4">
                                                        <div className="max-w-[200px] truncate" title={String(formatDisplayValue(header, row[header]))}>
                                                            {formatDisplayValue(header, row[header])}
                                                        </div>
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        {/* Scroll hint */}
                        <div className="text-xs text-muted-foreground text-center py-2 border-t bg-muted/30">
                            💡 Scroll horizontally to view all columns
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end">
                <Button
                    onClick={submitCandidates}
                    disabled={!isSubmitEnabled ||submitting}
                    className="bg-[#00b388] hover:bg-[#009e79]"
                >
                    Submit Candidates
                </Button>
            </div>
        </div>
    )
}

export default UploadMultipleCandidate