export const useTodaySales = () => ({ data: [], isLoading: false });
export const useAddSale = () => ({ mutate: (p, c) => c.onSuccess(), isPending: false });
export const useUndoLastSale = () => ({ mutate: (u, c) => c.onSuccess(), isPending: false });
export const useDailySummary = (sales) => ({
    totalAmount: 0,
    totalItems: 0,
    products: []
});
