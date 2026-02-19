export interface Product {
  id?: string;
  name: string;
  price: number;
  image: string;
  color: string;
}

export interface Sale {
  id: number;
  timestamp: string;
  items: Array<{ name: string; price: number }>;
  total: number;
}

export interface DailySummary {
  date: string;
  total_amount: number;
  sales_count: number;
  report_text: string;
}

export interface Expense {
  id?: number;
  date: string;
  amount: number;
  description: string;
  category: string;
}