import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
} from "@react-email/components";
import * as React from "react";

interface PrescriptionBriefEmailProps {
  operatorName: string;
  venueName: string;
  calmIndex: number;
  primaryDomain: string;
  primaryProblem: string;
  interventions: string[];
  weekFocus: string;
  watchSignal: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  throughput: "Throughput",
  defaults: "Defaults",
  signals: "Signals",
  pacing: "Pacing",
  endings: "Endings",
  people_load: "People Load",
  operational_memory: "Operational Memory",
};

export function PrescriptionBriefEmail({
  operatorName,
  venueName,
  calmIndex,
  primaryDomain,
  primaryProblem,
  interventions,
  weekFocus,
  watchSignal,
}: PrescriptionBriefEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Your Calm Index is {calmIndex}/10 — this week focus on{" "}
        {DOMAIN_LABELS[primaryDomain] ?? primaryDomain}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Weekly Prescription Brief</Heading>
          <Text style={subtitle}>{venueName}</Text>

          <Section style={scoreSection}>
            <Text style={scoreLabel}>Calm Index</Text>
            <Text style={scoreValue}>{calmIndex}/10</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>
              Primary Focus: {DOMAIN_LABELS[primaryDomain] ?? primaryDomain}
            </Heading>
            <Text style={text}>{primaryProblem}</Text>
          </Section>

          <Hr style={hr} />

          <Section>
            <Heading as="h2" style={h2}>
              This Week&apos;s Interventions
            </Heading>
            {interventions.map((intervention, i) => (
              <Text key={i} style={listItem}>
                {i + 1}. {intervention}
              </Text>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={focusSection}>
            <Heading as="h2" style={h2}>
              Week Focus
            </Heading>
            <Text style={focusText}>{weekFocus}</Text>
          </Section>

          <Section style={watchSection}>
            <Heading as="h2" style={h2}>
              Watch Signal
            </Heading>
            <Text style={watchText}>{watchSignal}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Hi {operatorName}, this prescription was generated based on your
            latest check-in. Focus on one thing at a time — small changes
            compound.
          </Text>
          <Text style={footer}>— Venue by Design</Text>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const h1: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const subtitle: React.CSSProperties = {
  color: "#666",
  fontSize: "14px",
  margin: "0 0 24px",
};

const scoreSection: React.CSSProperties = {
  textAlign: "center" as const,
  padding: "24px 0",
};

const scoreLabel: React.CSSProperties = {
  color: "#666",
  fontSize: "14px",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const scoreValue: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "48px",
  fontWeight: "700",
  margin: "8px 0 0",
};

const h2: React.CSSProperties = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const text: React.CSSProperties = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "1.6",
};

const listItem: React.CSSProperties = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "4px 0",
  paddingLeft: "8px",
};

const hr: React.CSSProperties = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const focusSection: React.CSSProperties = {
  backgroundColor: "#f0f7ff",
  padding: "16px",
  borderRadius: "6px",
  marginBottom: "16px",
};

const focusText: React.CSSProperties = {
  color: "#1a56db",
  fontSize: "15px",
  fontWeight: "500",
  lineHeight: "1.6",
};

const watchSection: React.CSSProperties = {
  backgroundColor: "#fff7ed",
  padding: "16px",
  borderRadius: "6px",
};

const watchText: React.CSSProperties = {
  color: "#c2410c",
  fontSize: "15px",
  fontWeight: "500",
  lineHeight: "1.6",
};

const footer: React.CSSProperties = {
  color: "#999",
  fontSize: "13px",
  lineHeight: "1.5",
};

export default PrescriptionBriefEmail;
