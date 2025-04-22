import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTransactionDate = (
  timestamp: Timestamp | undefined,
  isApproximate?: boolean,
): string => {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate();
    if (isApproximate) {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
      };
      let formatted = new Intl.DateTimeFormat("es-CL", options).format(date);
      formatted = formatted.replace(/^\w/, (c) => c.toUpperCase());
      return `${formatted}`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      return new Intl.DateTimeFormat("es-CL", options).format(date);
    }
  } catch (e) {
    console.error("Error formatting transaction date:", e);
    return "Fecha inválida";
  }
};
