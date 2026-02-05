import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useTodaySales, useAddSale, useUndoLastSale, useDailySummary } from "@/hooks/useSales";
import { useCloseCash } from "@/hooks/useCashClosure";
import { Header } from "@/components/pos/Header";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { ActionBar } from "@/components/pos/ActionBar";
import { CashClosureDialog } from "@/components/pos/CashClosureDialog";
import { toast } from "@/hooks/use-toast";
import type { Product } from "@/types/pos";

const Index = () => {
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: sales, isLoading: salesLoading } = useTodaySales();
  const addSale = useAddSale();
  const undoLastSale = useUndoLastSale();
  const closeCash = useCloseCash();

  const summary = useDailySummary(sales);

  // Create a map of product name -> quantity sold today
  const productQuantities = new Map<string, number>();
  summary.products.forEach((p) => {
    productQuantities.set(p.name, p.quantity);
  });

  const handleAddProduct = (product: Product) => {
    addSale.mutate(product, {
      onSuccess: () => {
        toast({
          title: `+1 ${product.name}`,
          description: `${product.price.toFixed(2)} MAD`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error al registrar venta",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleUndo = () => {
    undoLastSale.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Venta anulada",
          description: "Se ha eliminado la última venta",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleCloseCash = () => {
    setIsClosureDialogOpen(true);
  };

  const handleConfirmClosure = () => {
    closeCash.mutate(summary, {
      onSuccess: () => {
        toast({
          title: "Caja cerrada",
          description: `Total del día: ${summary.totalAmount.toFixed(2)} MAD`,
        });
        setIsClosureDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error al cerrar caja",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header totalAmount={summary.totalAmount} totalItems={summary.totalItems} />

      <main className="container mx-auto px-4 py-6">
        <ProductGrid
          products={products}
          productQuantities={productQuantities}
          onAddProduct={handleAddProduct}
          isLoading={productsLoading || salesLoading}
          isAdding={addSale.isPending}
        />
      </main>

      <ActionBar
        onUndo={handleUndo}
        onCloseCash={handleCloseCash}
        canUndo={sales !== undefined && sales.length > 0}
        canClose={summary.totalItems > 0}
        isUndoing={undoLastSale.isPending}
      />

      <CashClosureDialog
        open={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        summary={summary}
        onConfirm={handleConfirmClosure}
        isClosing={closeCash.isPending}
      />
    </div>
  );
};

export default Index;