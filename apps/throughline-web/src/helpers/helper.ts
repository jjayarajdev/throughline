import { formatDistanceToNow,format, isValid, parseISO,differenceInHours,formatDistance, addHours, differenceInDays } from "date-fns";
import { toast } from "@/lib/toast";

export function tatFormat(dateString?: string) {
  if (!dateString) return "unknown";
   const fixedDateString = dateString.replace(/(\.\d{3})\d+/, "$1");
  const parsedDate = parseISO(fixedDateString);

  if (!isValid(parsedDate)) {
    return "invalid date";
  } 

  const days = differenceInDays(new Date(), parsedDate);
  return `${days} days`;
}


export function tatBetweenTwoDates(dojString?: string, pcAllocDateString?: string) {
  
  if (!dojString || !pcAllocDateString) return "";
  const fixedDoj = dojString.replace(/(\.\d{3})\d+/, "$1");
  const doj = parseISO(fixedDoj);
  const dojPlus14Hrs = addHours(doj, 14);
  const fixedPcDate = pcAllocDateString.replace(/(\.\d{3})\d+/, "$1");
  const pcAllocDate = parseISO(fixedPcDate);
  if (!isValid(dojPlus14Hrs) || !isValid(pcAllocDate)) return "invalid date";
 return formatDistance(dojPlus14Hrs, pcAllocDate);
}

export function tatBetween(dojString?: string, pcAllocDateString?: string) {
  if (!dojString) return "unknown";
  pcAllocDateString = pcAllocDateString || new Date().toISOString();

  const fixedDoj = dojString.replace(/(\.\d{3})\d+/, "$1");
  const doj = parseISO(fixedDoj);

  const fixedPcDate = pcAllocDateString.replace(/(\.\d{3})\d+/, "$1");
  const pcAllocDate = parseISO(fixedPcDate);

  if (!isValid(doj) || !isValid(pcAllocDate)) {
    return "invalid date";
  }

  const days = differenceInDays(pcAllocDate, doj);
  return `${days} days`;
}


export function getTatHours(tatDateString: string,tatEndDate?:string): number {

  const tatDate = new Date(tatDateString);
  const now = new Date();
  return differenceInHours(tatEndDate ? tatEndDate:now, tatDate);
}
export const getTatColor = (start?: string, end?: string) => {
  if (!start) return "green"; // Default color if no start date
  const hours = getTatHours(start, end ?? new Date().toISOString());
  const days = Math.floor(hours / 24);
  
  if (days >= 120) return "purple";
  if (days >= 90) return "red";
  if (days >= 60) return "orange";
  if (days >= 30) return "yellow";
  return "green"; // 0-30 days
};

export function formatDate(utcDateStr: string): string {
  if (!utcDateStr) return "N/A";
  const date = parseISO(utcDateStr); 
  return format(date, 'dd-MM-yyyy'); 
}
export function isAfterDateTime(dateISO?: string, timeStr?: string): boolean {
  if (!dateISO || !timeStr) {
    return false;
  }

  try {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    if (
      [hours, minutes, seconds].some((val) => isNaN(val)) ||
      hours < 0 || hours > 23 ||
      minutes < 0 || minutes > 59 ||
      seconds < 0 || seconds > 59
    ) {
      return false;
    }

    const baseDate = new Date(dateISO);
    const localDateTime = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      seconds
    );

    return new Date() >= localDateTime;
  } catch {
    return false;
  }
}

export const formatTime = (timeStr?: string) => {
  if (!timeStr) return ""; // or return "N/A"
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes}`;
};

const today = new Date();
const currentYear = today.getFullYear();

// If today >= 1st November, then take next year as base year
const baseYear =
  today.getMonth() >= 10 // months are 0-based → 10 = November
    ? currentYear + 1
    : currentYear;

export const fyears = [
  { id: 1, name: "All FY" },
  ...Array.from({ length: 3 }, (_, i) => {
    const year = baseYear - i;
    return { id: year, name: year };
  }),
];



interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export function sortData<T extends Record<string, any>>(
  data: T[] = [],
  sortConfig?: SortConfig
): T[] {
  if (!sortConfig) return data;

  const { key, direction } = sortConfig;

  return [...data].sort((a, b) => {
    const aValue = a[key] ?? "";
    const bValue = b[key] ?? "";

    if (typeof aValue === "string" && typeof bValue === "string") {
      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
}

