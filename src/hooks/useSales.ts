export const useTodaySales = () => ({ data: [], isLoading: false });
export const useAddSale = () => ({ mutate: (p: any, c: any) => c.onSuccess(), isPending: false });
export const useUndoLastSale = () => ({ mutate: (u: any, c: any) => c.onSuccess(), isPending: false });
export const useDailySummary = (sales: any) => ({ totalAmount: 0, totalItems: 0, products: [] });