import LegalPageLayout from "@/components/LegalPageLayout";

const SECTIONS = [
  { id: "orders", title: "Orders & Pricing" },
  { id: "cod-compliance", title: "COD Compliance" },
  { id: "delivery", title: "Delivery" },
  { id: "returns", title: "Returns & Refunds" },
  { id: "account-conduct", title: "Account Conduct" },
  { id: "governing-law", title: "Governing Law" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions" lastUpdated="July 2026" sections={SECTIONS}>
      <section id="orders">
        <h2 className="font-headline-lg text-on-surface mb-3">1. Orders & Pricing</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          All prices are listed in PKR and include applicable taxes unless stated otherwise. We
          reserve the right to correct pricing errors and to cancel orders placed at an incorrect
          price, with a full refund if payment was already made.
        </p>
      </section>

      <section id="cod-compliance">
        <h2 className="font-headline-lg text-on-surface mb-3">2. Cash on Delivery Compliance</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          For Cash on Delivery orders, please be available at the delivery address to receive your
          order and complete payment. On some orders we may request a small advance token payment
          before dispatch to confirm the booking — this will always be shown clearly at checkout
          before you confirm your order. Repeated refusal of COD deliveries may result in future
          orders requiring advance payment.
        </p>
      </section>

      <section id="delivery">
        <h2 className="font-headline-lg text-on-surface mb-3">3. Delivery</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We aim to prepare every order within 24 hours. Delivery timelines vary by location and
          courier availability, and are estimates rather than guarantees. You can track any order's
          status from <a href="/track-order" className="text-primary hover:underline">Track Order</a>.
        </p>
      </section>

      <section id="returns">
        <h2 className="font-headline-lg text-on-surface mb-3">4. Returns & Refunds</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Most items can be returned within 7 days of delivery if unworn, unwashed, and with tags
          intact. Visit <a href="/account/returns" className="text-primary hover:underline">Returns &amp; Refunds</a> to
          start a request. Full details are in our{" "}
          <a href="/shipping-returns" className="text-primary hover:underline">Shipping &amp; Returns policy</a>.
        </p>
      </section>

      <section id="account-conduct">
        <h2 className="font-headline-lg text-on-surface mb-3">5. Account Conduct</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Creating an account lets you track orders, save addresses, and manage returns. We reserve
          the right to suspend accounts involved in fraudulent orders, repeated non-collection of
          COD parcels, or abuse of our return policy.
        </p>
      </section>

      <section id="governing-law" className="pb-stack-lg">
        <h2 className="font-headline-lg text-on-surface mb-3">6. Governing Law</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          These terms are governed by the laws of Pakistan. Any disputes will be subject to the
          exclusive jurisdiction of the courts in our operating region.
        </p>
      </section>
    </LegalPageLayout>
  );
}