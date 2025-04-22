import { Timestamp } from "firebase/firestore";

export interface Transaction {
  id: string;
  addedBy: string;
  amount: number;
  createdAt: Timestamp;
  date: Timestamp;
  description: string;
  isDateApproximate: boolean;
  receiptNumber: string;
  receiptUrl: string;
  type: "ingreso" | "egreso";
}
