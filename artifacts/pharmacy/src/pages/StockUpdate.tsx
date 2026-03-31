import React, { useState } from "react";
import { PackagePlus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, addStockUpdate } from "@/lib/useFirebase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function StockUpdate() {
  const { role, logActivity } = useAuth();
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products } = useProducts();

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.cat.toLowerCase().includes(search.toLowerCase())
  );

  const handleQtyChange = (key: string, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      const next = { ...updates };
      delete next[key];
      setUpdates(next);
    } else {
      setUpdates(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleSubmit = async () => {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;
    setIsSubmitting(true);

    try {
      const items = keys.map(key => {
        const p = products.find(x => x._key === key)!;
        return { productId: key, productName: p.name, qtyAdded: updates[key] };
      });

      await addStockUpdate({
        note,
        staffRole: role || "staff",
        createdAt: new Date().toISOString(),
        items
      });

      logActivity("stock", `Added stock for ${items.length} products: ${items.map(i => `${i.productName} +${i.qtyAdded}`).join(", ")}`);
      setUpdates({});
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalUpdates = Object.keys(updates).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Stock</h1>
          <p className="text-muted-foreground mt-1">Enter quantities received</p>
        </div>
      </div>

      <Card className="p-5 border-stock/20 bg-stock-light/30">
        <p className="text-sm text-muted-foreground mb-4">
          Enter the quantity <strong>added</strong> for each product received. Leave blank or 0 if unchanged.
        </p>
        <div className="max-w-md">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Delivery Note (optional)
          </label>
          <Input 
            placeholder="e.g. Cosmos delivery, batch #12" 
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 sticky top-[60px] md:top-0 z-10 bg-background/80 backdrop-blur py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Input 
          placeholder="Search products..." 
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button 
          variant="stock" 
          size="lg" 
          onClick={handleSubmit}
          disabled={totalUpdates === 0 || isSubmitting}
          className="w-full sm:w-auto shadow-hover"
        >
          <PackagePlus className="w-5 h-5 mr-2" />
          Submit {totalUpdates > 0 ? `(${totalUpdates})` : ""}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map(p => (
          <div key={p._key} className="bg-surface border border-border rounded-xl p-4 shadow-soft flex flex-col focus-within:border-stock focus-within:ring-1 focus-within:ring-stock/50 transition-all">
            <div className="font-semibold text-sm line-clamp-2 mb-1">{p.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-3">
              Now: {p.qty} {p.unit}
              {p.qty <= p.low && <span className="text-warning ml-1">⚠️</span>}
            </div>
            
            <div className="flex items-center gap-2 mt-auto">
              <span className="text-muted-foreground font-bold">+</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={updates[p._key!] || ""}
                onChange={(e) => handleQtyChange(p._key!, e.target.value)}
                className="w-16 h-9 border border-border rounded-md bg-muted/50 text-center font-mono font-bold focus:bg-surface focus:outline-none focus:border-stock"
              />
              <span className="text-xs text-muted-foreground font-medium">{p.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
