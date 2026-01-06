export interface Customer {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  email: string;
  phone: string;
  joinDate: string;
  address: string;
  totalTransactions: number;
  totalSpending: string;
  totalSpendingRaw: number;
  status: string;
  customer_details?: Array<{
    target: string;
    value: string;
  }>;
  created_at: string;
}

