import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users as UsersIcon, ChevronRight } from "lucide-react";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import SearchField from "../components/ui/SearchField";
import { PageHeader } from "../components/ui/Layout";

/**
 * Read-only customer directory. Data comes from the website's canonical
 * `public.customers` table via GET /api/customers — the POS never creates,
 * edits or deletes customers. Search is server-side over the real
 * name / phone / email fields.
 */
export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");

  const loadCustomers = useCallback((q = "") => {
    const url = q
      ? `http://localhost:3000/api/customers?search=${encodeURIComponent(q)}`
      : "http://localhost:3000/api/customers";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.customers);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  function submitSearch(e) {
    e.preventDefault();
    setCustomers(null);
    setLoadError(false);
    loadCustomers(search.trim());
  }

  function retry() {
    setCustomers(null);
    setLoadError(false);
    loadCustomers(search.trim());
  }

  return (
    <div className="mx-auto max-w-[1200px] flex flex-col gap-5">
      <PageHeader
        title="Customers"
        description="Customer accounts from the online store. Read-only."
      >
        <form onSubmit={submitSearch}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search name, phone or email…"
            className="w-72"
          />
        </form>
      </PageHeader>

      {loadError ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <ErrorState
            title="Couldn't load customers"
            description="The local server didn't respond. Check the connection and try again."
            onRetry={retry}
          />
        </div>
      ) : customers === null ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <LoadingState label="Loading customers…" />
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <EmptyState
            icon={UsersIcon}
            title={search ? "No customers match your search" : "No customers yet"}
            description={
              search
                ? "Try a different name, phone or email."
                : "Customer accounts created on the online store will appear here."
            }
          />
        </div>
      ) : (
        <>
          <p className="type-body-sm text-text-secondary">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
            {search && " matching your search"}
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Email</TH>
                <TH align="right">Orders</TH>
                <TH>Joined</TH>
                <TH align="right"> </TH>
              </TR>
            </THead>
            <TBody>
              {customers.map((c) => (
                <TR key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                  <TD className="font-medium">{c.full_name || "—"}</TD>
                  <TD className="text-text-secondary">{c.phone || "—"}</TD>
                  <TD className="text-text-secondary">{c.email || "—"}</TD>
                  <TD align="right">{c.orders_count ?? 0}</TD>
                  <TD className="text-text-secondary">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </TD>
                  <TD align="right">
                    <ChevronRight
                      size={15}
                      className="text-text-muted inline-block"
                    />
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
