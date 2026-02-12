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
  totalAmount: number;
  sales: Sale[];
}