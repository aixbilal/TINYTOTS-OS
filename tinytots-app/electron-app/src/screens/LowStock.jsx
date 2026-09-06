import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, PackageCheck } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";

export default function LowStock() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    fetch("http://localhost:3000/api/low-stock")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setItems(data.items);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  function retry() {
    setItems(null);
    setLoadError(false);
    load();
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-[1200px] flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-heading-lg text-text-primary">Low Stock</h1>
          <p className="type-body-sm text-text-secondary mt-0.5">
            Items at or below the reorder threshold — restock these soon.
          </p>
        </div>
        {items?.length > 0 && (
          <Button variant="secondary" onClick={() => navigate("/inventory")}>
            Go to Inventory
          </Button>
        )}
      </div>

      {loadError ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState onRetry={retry} />
        </div>
      ) : items === null ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Loading low stock items…" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <EmptyState
            icon={PackageCheck}
            title="Stock looks healthy"
            description="Nothing is at or below the reorder threshold right now."
          />
        </div>
      ) : (
        <>
          <p className="type-body-sm text-text-secondary">
            {items.length} item{items.length === 1 ? "" : "s"} need attention
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Item</TH>
                <TH>Size / Colour</TH>
                <TH>Code</TH>
                <TH align="right">Stock left</TH>
                <TH>Supplier ID</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.variantId}>
                  <TD className="font-medium">{item.name}</TD>
                  <TD className="text-text-secondary capitalize">
                    {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                  </TD>
                  <TD className="type-mono type-caption text-text-secondary">
                    {item.publicCode || "—"}
                  </TD>
                  <TD align="right">
                    <Badge variant={item.stock <= 0 ? "error" : "warning"}>
                      {item.stock <= 0 ? (
                        <>
                          <AlertTriangle size={11} /> Out of stock
                        </>
                      ) : (
                        `${item.stock} left`
                      )}
                    </Badge>
                  </TD>
                  <TD className="text-text-secondary">
                    {item.supplierId || <span className="text-text-muted italic">Not set</span>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </div>
  );
}
