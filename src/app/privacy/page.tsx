import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_SITE_URL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Venue by Design",
  description: "How Venue by Design collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Who we are">
        <p>
          {LEGAL_ENTITY_NAME} ({LEGAL_SITE_URL}) provides software for Australian hospitality
          operators. This Privacy Policy explains how we collect, use, disclose, and protect personal
          information in line with the Privacy Act 1988 (Cth) and the Australian Privacy Principles
          (APPs).
        </p>
        <p>
          Contact us about privacy:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#C9A87C] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Account data</strong> — name, email, password
            (stored by Supabase Auth), venue name, and onboarding details.
          </li>
          <li>
            <strong className="text-foreground">Operational data</strong> — weekly check-in
            responses, domain scores, Calm Index history, diagnostic questionnaire answers, and
            prescription brief content.
          </li>
          <li>
            <strong className="text-foreground">Ask chat</strong> — messages you send to the in-app
            assistant and related context needed to respond.
          </li>
          <li>
            <strong className="text-foreground">Payment data</strong> — billing status, Stripe
            customer and subscription identifiers. Card details are collected and processed by
            Stripe; we do not store full card numbers.
          </li>
          <li>
            <strong className="text-foreground">Technical data</strong> — IP address, browser
            type, device information, and usage logs for security and reliability.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>provide and maintain the Service, including authentication and plan entitlements;</li>
          <li>generate AI-assisted diagnostics, prescriptions, and chat responses;</li>
          <li>process payments and send service-related emails (e.g. prescription briefs);</li>
          <li>improve features, troubleshoot issues, and protect against fraud or abuse;</li>
          <li>comply with legal obligations and respond to lawful requests.</li>
        </ul>
        <p>
          We do not sell your personal information. We may send product updates or support messages;
          you can opt out of non-essential marketing where applicable.
        </p>
      </LegalSection>

      <LegalSection title="4. AI processing">
        <p>
          Selected features send relevant prompts and context to Anthropic&apos;s API to generate
          responses. We configure these requests to operate the Service only. Do not submit
          sensitive personal information about staff or customers unless necessary for your use case.
          AI outputs are described further in our Terms &amp; Conditions.
        </p>
      </LegalSection>

      <LegalSection title="5. Third-party service providers">
        <p>We use trusted providers who process data on our behalf, including:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Supabase</strong> — authentication and database
            hosting;
          </li>
          <li>
            <strong className="text-foreground">Stripe</strong> — payments and subscription
            billing;
          </li>
          <li>
            <strong className="text-foreground">Anthropic</strong> — AI inference for diagnostics,
            prescriptions, and Ask chat;
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — transactional email delivery;
          </li>
          <li>
            <strong className="text-foreground">Hosting and monitoring</strong> — infrastructure
            and error reporting (e.g. Sentry) where enabled.
          </li>
        </ul>
        <p>
          These providers may store or process data in Australia or overseas. We take reasonable
          steps to ensure overseas recipients handle information consistently with the APPs.
        </p>
      </LegalSection>

      <LegalSection title="6. Storage and security">
        <p>
          We apply technical and organisational measures appropriate to the sensitivity of the data,
          including access controls, encryption in transit, and secure credential handling. No
          method of transmission or storage is completely secure; please use a strong password and
          protect your account.
        </p>
      </LegalSection>

      <LegalSection title="7. Retention">
        <p>
          We retain personal information while your account is active and as needed to provide the
          Service, meet legal obligations, resolve disputes, and enforce agreements. You may request
          deletion subject to limits (e.g. records we must keep for tax or law enforcement).
        </p>
      </LegalSection>

      <LegalSection title="8. Access, correction, and complaints">
        <p>
          You may request access to or correction of personal information we hold about you by
          emailing{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#C9A87C] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          . We will respond within a reasonable period.
        </p>
        <p>
          If you believe we have breached the APPs, contact us first. You may also lodge a complaint
          with the Office of the Australian Information Commissioner (OAIC) at{" "}
          <a
            href="https://www.oaic.gov.au"
            className="text-[#C9A87C] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            oaic.gov.au
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies and local storage">
        <p>
          We use cookies and similar technologies for authentication sessions, preferences, and
          basic analytics. You can control cookies through your browser; disabling them may limit
          sign-in and core functionality.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>
          The Service is not directed at children under 18. We do not knowingly collect personal
          information from children.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be posted on
          this page with an updated date. Continued use after changes constitutes acceptance where
          permitted by law.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
