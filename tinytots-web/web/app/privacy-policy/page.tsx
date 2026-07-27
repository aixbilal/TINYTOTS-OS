import LegalPageLayout from "@/components/LegalPageLayout";

const SECTIONS = [
  { id: "data-collection", title: "Data Collection" },
  { id: "how-we-use-it", title: "How We Use It" },
  { id: "secure-payment", title: "Secure Payment" },
  { id: "your-account", title: "Your Account" },
  { id: "cookies", title: "Cookies" },
  { id: "contact", title: "Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="July 2026" sections={SECTIONS}>
      <section id="data-collection">
        <h2 className="font-headline-lg text-on-surface mb-3">1. Data Collection</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          When you shop with TinyTots, we collect the information needed to process your order and
          keep you updated on it — your name, phone number, delivery address, and order history. If
          you create an account, we also store your email and login details securely through our
          authentication provider.
        </p>
      </section>

      <section id="how-we-use-it">
        <h2 className="font-headline-lg text-on-surface mb-3">2. How We Use It</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your information is used to fulfill and deliver your orders, send order status updates,
          respond to your questions and return requests, and improve our product range. We do not
          sell your personal data to third parties.
        </p>
      </section>

      <section id="secure-payment">
        <h2 className="font-headline-lg text-on-surface mb-3">3. Secure Payment</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-3">
          We support Cash on Delivery, JazzCash, Easypaisa, and card payments. All online payments
          are processed through our payment partners' secure, encrypted gateways — we never store
          your full card or wallet credentials on our own servers.
        </p>
        <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant list-disc pl-5">
          <li><span className="text-on-surface font-medium">Cash on Delivery:</span> pay in cash when your order arrives.</li>
          <li><span className="text-on-surface font-medium">JazzCash / Easypaisa:</span> pay instantly via mobile wallet.</li>
          <li><span className="text-on-surface font-medium">Card:</span> Visa/Mastercard accepted via our secure processor.</li>
        </ul>
      </section>

      <section id="your-account">
        <h2 className="font-headline-lg text-on-surface mb-3">4. Your Account</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          You're responsible for keeping your login credentials confidential. If you believe someone
          has accessed your account without permission, please contact us immediately so we can help
          secure it.
        </p>
      </section>

      <section id="cookies">
        <h2 className="font-headline-lg text-on-surface mb-3">5. Cookies</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We use essential cookies to keep you signed in and remember your cart. We don't use
          third-party advertising trackers.
        </p>
      </section>

      <section id="contact" className="pb-stack-lg">
        <h2 className="font-headline-lg text-on-surface mb-3">6. Contact Us</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Questions about this policy or your data? Reach out anytime through our{" "}
          <a href="/contact" className="text-primary hover:underline">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}