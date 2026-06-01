import React, { useState } from "react";
import { berekenJaarruimte, JaarruimteInput, JaarruimteResultaat, BerekeningStap } from "../../types/jaarruimte";

// ─── Stijl-hulpfuncties ──────────────────────────────────────────────────────

const euro = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const perc = (n: number) => `${(n * 100).toFixed(2)}%`;

// ─── Sub-componenten ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  waarde: string;
  accent?: boolean;
  info?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, waarde, accent, info }) => (
  <div
    style={{
      background: accent ? "#1a56db" : "#f8fafc",
      color: accent ? "#fff" : "#1e293b",
      borderRadius: 12,
      padding: "20px 24px",
      boxShadow: accent ? "0 4px 20px rgba(26,86,219,0.25)" : "0 1px 4px rgba(0,0,0,0.07)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    <span style={{ fontSize: 13, opacity: 0.75, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
    <span style={{ fontSize: 28, fontWeight: 800 }}>{waarde}</span>
    {info && (
      <span style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{info}</span>
    )}
  </div>
);

interface StapRowProps {
  stap: BerekeningStap;
  isOpen: boolean;
  onToggle: () => void;
}

const StapRow: React.FC<StapRowProps> = ({ stap, isOpen, onToggle }) => (
  <div
    style={{
      borderBottom: "1px solid #e2e8f0",
      padding: "0",
    }}
  >
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#1a56db",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {stap.stap}
      </span>
      <span style={{ flex: 1, fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
        {stap.omschrijving}
      </span>
      <span style={{ fontWeight: 700, color: "#1a56db", fontSize: 16, marginRight: 8 }}>
        {euro(stap.resultaat)}
      </span>
      <span style={{ fontSize: 18, color: "#94a3b8", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
        ▾
      </span>
    </button>
    {isOpen && (
      <div
        style={{
          background: "#f1f5f9",
          borderLeft: "4px solid #1a56db",
          margin: "0 16px 14px 16px",
          borderRadius: "0 8px 8px 0",
          padding: "12px 16px",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: 13,
            color: "#334155",
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {stap.berekening}
        </pre>
      </div>
    )}
  </div>
);

// ─── Hoofd-component ─────────────────────────────────────────────────────────

interface JaarruimteResultProps {
  input?: JaarruimteInput;
}

const DEFAULT_INPUT: JaarruimteInput = {
  brutojaarinkomen: 95_000,
  factorA: 2_800,
  onbenutteRuimteVorigeJaren: 6_500,
  jaar: 2025,
};

const JaarruimteResultComponent: React.FC<JaarruimteResultProps> = ({
  input = DEFAULT_INPUT,
}) => {
  const r: JaarruimteResultaat = berekenJaarruimte(input);
  const [openStap, setOpenStap] = useState<number | null>(null);

  const toggle = (stap: number) =>
    setOpenStap((prev) => (prev === stap ? null : stap));

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 780,
        margin: "0 auto",
        padding: "32px 16px",
        color: "#1e293b",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#1a56db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            💼
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Jaarruimte Berekening {input.jaar ?? 2025}
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
              Lijfrente fiscale ruimte — mevrouw De Vries
            </p>
          </div>
        </div>

        {/* Invoer-samenvatting */}
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontSize: 14,
            color: "#475569",
          }}
        >
          <span><strong>Bruto inkomen:</strong> {euro(input.brutojaarinkomen)}</span>
          <span><strong>Factor A:</strong> {euro(input.factorA)}</span>
          <span><strong>Reserveringsruimte (schatting):</strong> {euro(input.onbenutteRuimteVorigeJaren)}</span>
        </div>
      </div>

      {/* Kerngetallen */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Netto jaarruimte"
          waarde={euro(r.jaarruimteNetto)}
          accent
          info="Fiscaal aftrekbaar in 2025"
        />
        <StatCard
          label="Reserveringsruimte"
          waarde={euro(r.reserveringsruimte)}
          info="Onbenut uit voorgaande jaren"
        />
        <StatCard
          label="Totaal inlegbaar"
          waarde={euro(r.totaalMaximaalInlegbaar)}
          info="Jaarruimte + reserveringsruimte"
        />
        <StatCard
          label="Belastingvoordeel"
          waarde={euro(r.belastingVoordeelTotaal)}
          info={`Bij ${perc(r.marginaalTarief)} marginaal tarief`}
        />
      </div>

      {/* Netto kosten na belastingvoordeel */}
      <div
        style={{
          background: "#ecfdf5",
          border: "1.5px solid #6ee7b7",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>✅</span>
        <div>
          <strong style={{ color: "#065f46", fontSize: 16 }}>
            Netto kosten totale inleg: {euro(r.totaalMaximaalInlegbaar - r.belastingVoordeelTotaal)}
          </strong>
          <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
            U legt {euro(r.totaalMaximaalInlegbaar)} in maar ontvangt {euro(r.belastingVoordeelTotaal)} terug via de belastingaangifte.
            Effectief kost dit slechts {euro(r.totaalMaximaalInlegbaar - r.belastingVoordeelTotaal)}.
          </div>
        </div>
      </div>

      {/* Stap-voor-stap berekening */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Stap-voor-stap berekening
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
          Klik op een stap om de volledige berekening te zien.
        </p>

        <div
          style={{
            border: "1.5px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {r.stappen.map((stap) => (
            <StapRow
              key={stap.stap}
              stap={stap}
              isOpen={openStap === stap.stap}
              onToggle={() => toggle(stap.stap)}
            />
          ))}
        </div>
      </div>

      {/* Toelichting onderaan */}
      <div
        style={{
          marginTop: 32,
          background: "#fffbeb",
          border: "1.5px solid #fde68a",
          borderRadius: 10,
          padding: "14px 18px",
          fontSize: 13,
          color: "#92400e",
          lineHeight: 1.6,
        }}
      >
        <strong>Let op:</strong> Deze berekening is gebaseerd op de wettelijke parameters voor belastingjaar 2025.
        De jaarruimte moet vóór 1 juli van het <em>volgende</em> jaar (dus vóór 1 juli 2026) worden benut.
        Reserveringsruimte heeft een terugkijkperiode van maximaal 10 jaar.
        Raadpleeg altijd een belastingadviseur voor persoonlijke situaties.
      </div>
    </div>
  );
};

export default JaarruimteResultComponent;
