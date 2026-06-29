import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_ENTITY_NAME,
  LEGAL_SITE_URL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & Conditions | Venue by Design",
  description: "Terms and conditions for using Venue by Design.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <LegalSection title="1. Agreement">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the{" "}
          {LEGAL_ENTITY_NAME} platform at {LEGAL_SITE_URL} and related services (the
          &quot;Service&quot;). By creating an account, purchasing a subscription or diagnostic,
          or otherwise using the Service, you agree to these Terms. If you do not agree, do not use
          the Service.
        </p>
        <p>
          The Service is offered to Australian hospitality operators and venue owners. You must be
          at least 18 years old and have authority to bind the business you represent.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          Venue by Design provides software tools for venue operators, including weekly check-ins, a
          Calm Index score, domain-based tracking, AI-generated diagnostic reports, prescription
          briefs, and an Ask chat assistant (&quot;Ask&quot;). Features vary by plan (Venue Pulse
          subscription tiers and Deep Diagnostic one-time purchases).
        </p>
        <p>
          We may update, improve, or discontinue features with reasonable notice where practicable.
          We do not guarantee uninterrupted availability.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts">
        <p>
          You register using email and password via our authentication provider (Supabase). You are
          responsible for keeping your credentials secure and for all activity under your account.
          Provide accurate business and contact information during onboarding.
        </p>
        <p>
          We may suspend or terminate accounts that violate these Terms, abuse the Service, or pose
          a security risk.
        </p>
      </LegalSection>

      <LegalSection title="4. Subscriptions and payments">
        <p>
          Paid plans are billed in Australian dollars (AUD) through Stripe. Subscriptions renew
          automatically each billing period until you cancel via the billing portal or as otherwise
          described at checkout. One-time Deep Diagnostic purchases are charged once at the listed
          price.
        </p>
        <p>
          Prices, features, and plan names are shown on our pricing page. Taxes may apply where
          required by law. Failed payments may result in suspension of paid features until resolved.
        </p>
        <p>
          Refunds are handled in line with Australian Consumer Law. Nothing in these Terms excludes
          rights you cannot lawfully waive. For billing questions, contact{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#C9A87C] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="5. AI-generated content">
        <p>
          Parts of the Service use artificial intelligence (Anthropic) to generate diagnostic
          insights, prescription briefs, scores, and chat responses. This output is generated from
          your inputs and our methodology; it is informational and operational guidance only.
        </p>
        <p>
          AI content is not legal, financial, medical, HR, or professional advice. You remain
          responsible for decisions at your venue. Verify important information and consult qualified
          professionals where appropriate. We do not guarantee accuracy, completeness, or fitness
          for a particular purpose of AI-generated content.
        </p>
      </LegalSection>

      <LegalSection title="6. Your data and content">
        <p>
          You retain ownership of information you submit (check-in responses, diagnostic answers,
          venue details, and chat messages). You grant us a licence to use that information to
          operate, improve, and secure the Service, including generating AI outputs and sending
          emails you request (such as prescription briefs).
        </p>
        <p>
          Do not submit unlawful, confidential third-party data without permission, or content that
          infringes others&apos; rights. Our Privacy Policy describes how we collect and handle
          personal information.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>reverse engineer, scrape, or overload the Service;</li>
          <li>use the Service to harass, discriminate, or break the law;</li>
          <li>share accounts or resell access without our written consent;</li>
          <li>attempt to bypass security, payment, or access controls.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          The Service, including software, design, branding, methodology, and documentation, is
          owned by {LEGAL_ENTITY_NAME} or its licensors. These Terms do not transfer ownership to
          you. You may use the Service only as permitted here and on your active plan.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimer and limitation of liability">
        <p>
          To the maximum extent permitted by law, the Service is provided &quot;as is&quot;. We
          disclaim warranties not required by law. Our liability for any claim arising from the
          Service is limited to the greater of (a) amounts you paid us in the 12 months before the
          claim, or (b) AUD $100, except where liability cannot be limited under Australian
          Consumer Law.
        </p>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>
          You may stop using the Service at any time. We may terminate or suspend access for breach
          of these Terms or non-payment. On termination, your right to use the Service ends;
          provisions that by nature should survive (including payment obligations, disclaimers, and
          liability limits) continue.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>
          These Terms are governed by the laws of New South Wales, Australia. You submit to the
          non-exclusive jurisdiction of courts in New South Wales, subject to any mandatory
          consumer protections in your state or territory.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Questions about these Terms:{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-[#C9A87C] hover:underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
