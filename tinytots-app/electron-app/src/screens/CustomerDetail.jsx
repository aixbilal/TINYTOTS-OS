import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, CalendarDays, ShoppingBag } from "lucide-react";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import Badge from "../components/ui/Badge";

const pkr = (v) => `Rs. ${Math.round(Number(v || 0)).toLocaleString("en-PK")}`;

const STATUS_VARIANT = {
  new: "info",
  processing: "warning",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
};

/**
 * Read-only customer profile. Identity + contact come from the canonical
 * `public.customers` row; the order history is the customer's online-store
 * orders (`public.orders`). POS sales are not yet linked to customers, so
 * only storefront orders are shown here.
 */
export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null); // { customer, recentOrders }
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    fetch(`http://localhost:3000/api/customers/${id}`)
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (ok && body.success) {
          setData({
            customer: body.customer,
            recentOrders: body.recentOrders || [],
          });
          setLoadError(false);
          setNotFound(false);
        } else if (!ok && body && body.message) {
          setNotFound(true);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function retry() {
    setData(null);
    setLoadError(false);
    setNotFound(false);
    load();
  }

  const customer = data?.customer;
  const orders = data?.recentOrders || [];

  return (
    <div className="mx-auto max-w-[900px] flex flex-col gap-4">
      <button
        onClick={() => navigate("/customers")}
        className="type-nav inline-flex items-center gap-2 text-text-secondary hover:text-text-primary w-fit"
      >
        <ArrowLeft size={15} /> Back to customers
      </button>

      {loadError ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState onRetry={retry} />
        </div>
      ) : notFound ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <EmptyState
            title="Customer not found"
            description="This customer may have been removed on the online store."
            action={{ label: "Back to customers", onClick: () => navigate("/customers") }}
          />
        </div>
      ) : data === null ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Loading customer…" />
        </div>
      ) : (
        <>
          {/* Identity */}
          <div className="rounded-xl border border-border-default bg-surface-panel p-6">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-full bg-brand text-pure-white text-xl font-semibold flex items-center justify-center shrink-0">
                {customer.full_name?.[0]?.toUpperCase() || "?"}
              </span>
              <div className="min-w-0">
                <h1 className="type-heading-sm text-text-primary truncate">
                  {customer.full_name || "Unnamed customer"}
                </h1>
                <p className="type-body-sm text-text-muted">
                  {customer.orders_count ?? 0} order
                  {(customer.orders_count ?? 0) === 1 ? "" : "s"} on record
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border-default pt-5">
              <Detail icon={Phone} label="Phone" value={customer.phone || "—"} />
              <Detail icon={Mail} label="Email" value={customer.email || "—"} />
              <Detail
                icon={CalendarDays}
                label="Joined"
                value={
                  customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString()
                    : "—"
                }
              />
            </dl>
          </div>

          {/* Online order history */}
          <div className="flex flex-col gap-2">
            <h2 className="type-section text-text-primary">Online Orders</h2>
            {orders.length === 0 ? (
              <div className="rounded-xl border border-border-default bg-surface-panel">
                <EmptyState
                  icon={ShoppingBag}
                  title="No online orders"
                  description="This customer has no orders from the online store."
                  className="py-10"
                />
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Order</TH>
                    <TH>Status</TH>
                    <TH>Date</TH>
                    <TH align="right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {orders.map((o) => (
                    <TR key={o.id}>
                      <TD className="type-mono type-caption text-text-secondary">
                        {o.order_number}
                      </TD>
                      <TD>
                        <Badge variant={STATUS_VARIANT[o.status] || "neutral"}>
                          <span className="capitalize">{o.status}</span>
                        </Badge>
                      </TD>
                      <TD className="text-text-secondary">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleDateString()
                          : "—"}
                      </TD>
                      <TD align="right">{pkr(o.total)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="type-field-label text-text-muted inline-flex items-center gap-1.5">
        <Icon size={13} /> {label}
      </p>
      <p className="type-body-sm text-text-primary mt-1 break-words">{value}</p>
    </div>
  );
}
