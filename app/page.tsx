"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Result = {
  seller: string;
  keyword?: string;
  subject?: string;
  timestamp: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
};

interface CampaignSettings {
  keywords: string[];
  cooldownMinutes: number;
  messagesPerKeyword: number;
  messageTemplates: string[];
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  sponsoredOnly: boolean;
}

function Pool({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="pool">
      <div className="pooltitle">
        <span>{label}</span>
        <small>up to 5</small>
      </div>
      {values.map((value, index) => (
        <input
          key={`${label}-${index}`}
          value={value}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))
          }
        />
      ))}
      {values.length < 5 && (
        <button className="add" type="button" onClick={() => onChange([...values, ""])}>
          + Add another
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [runError, setRunError] = useState("");
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [phone, setPhone] = useState("0624530190");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [startedAt, setStartedAt] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem('campaignSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings(parsed);
      setPhone(parsed.senderPhone || "0624530190");
    }
  }, []);

  function unlock() {
    if (!password.trim()) {
      setLoginError("Enter the workspace password");
      return;
    }
    setLoginError("");
    setAuthenticated(true);
    setPassword("");
  }

  async function startOutreach() {
    if (!settings) {
      setRunError("Geen instellingen gevonden. Ga naar Instellingen om te configureren.");
      return;
    }

    if (selectedKeywords.length === 0) {
      setRunError("Selecteer minimaal één zoekwoord");
      return;
    }

    setRunning(true);
    setRunError("");
    setResults([]);
    setStartedAt(new Date().toLocaleString());

    try {
      const messagesToSend = useCustomMessage && customMessage
        ? [customMessage]
        : settings.messageTemplates;

      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords,
          count: settings.messagesPerKeyword,
          messages: messagesToSend,
          names: [settings.senderName],
          emails: [settings.senderEmail],
          subjects: [settings.subject],
          phone: phone,
          cooldownMinutes: settings.cooldownMinutes,
          sponsoredOnly: settings.sponsoredOnly,
        }),
      });
      if (!response.ok) throw new Error("Run failed");
      const data = (await response.json()) as { results?: Result[]; error?: string };
      setResults(data.results ?? []);
      if (data.error) setRunError(data.error);
    } catch {
      setRunError("Run failed. Check the workflow service and try again.");
    } finally {
      setRunning(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="login">
        <h1>BOL Seller Messenger</h1>
        <input
          type="password"
          placeholder="Workspace password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
        />
        <button onClick={unlock}>Unlock</button>
        {loginError && <div className="error">{loginError}</div>}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>BOL Seller Messenger</h1>
          <p className="subtitle">Automatisch contact maken met verkopers op BOL.nl</p>
        </div>
        <Link href="/settings" className="settings-button">
          ⚙️ Instellingen
        </Link>
      </div>

      {!settings && (
        <div className="warning-box">
          <p>
            ⚠️ Geen instellingen gevonden. Ga naar{' '}
            <Link href="/settings" style={{ textDecoration: 'underline', fontWeight: 600 }}>
              Instellingen
            </Link>{' '}
            om uw campagne te configureren.
          </p>
        </div>
      )}

      {settings && (
        <div className="info-box">
          <h3>Huidige Instellingen:</h3>
          <div className="info-grid">
            <p>• {settings.keywords.length} zoekwoorden geconfigureerd</p>
            <p>• {settings.messagesPerKeyword} berichten per zoekwoord</p>
            <p>• {settings.cooldownMinutes} minuten cooldown</p>
            <p>• {settings.messageTemplates.length} bericht templates</p>
          </div>
        </div>
      )}

      <div className="form">
        {settings && (
          <>
            <div className="field">
              <label>Selecteer Zoekwoorden</label>
              <div className="keyword-buttons">
                {settings.keywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      if (selectedKeywords.includes(kw)) {
                        setSelectedKeywords(selectedKeywords.filter((k) => k !== kw));
                      } else {
                        setSelectedKeywords([...selectedKeywords, kw]);
                      }
                    }}
                    className={selectedKeywords.includes(kw) ? 'keyword-button selected' : 'keyword-button'}
                  >
                    {kw}
                  </button>
                ))}
              </div>
              <p className="hint">
                Geselecteerd: {selectedKeywords.length > 0 ? selectedKeywords.join(', ') : 'Geen'}
              </p>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={useCustomMessage}
                  onChange={(e) => setUseCustomMessage(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Gebruik aangepast bericht (in plaats van templates)
              </label>
              {useCustomMessage && (
                <textarea
                  rows={6}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Schrijf uw aangepaste bericht... Gebruik {{sellerName}}, {{productTitle}}, etc."
                  style={{ fontFamily: 'monospace', fontSize: '13px', marginTop: '8px' }}
                />
              )}
              {!useCustomMessage && (
                <>
                  <p className="hint" style={{ marginTop: '8px', marginBottom: '12px' }}>
                    Het systeem zal willekeurig een template kiezen uit uw {settings.messageTemplates.length} geconfigureerde templates
                  </p>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Preview van templates:</h4>
                    {settings.messageTemplates.map((template, index) => (
                      <div key={index} style={{ marginBottom: '12px', padding: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Template {index + 1}:</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>
                          {template}
                        </pre>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="phone">Telefoonnummer (optioneel)</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0612345678"
          />
        </div>

        <button onClick={startOutreach} disabled={running || !settings || selectedKeywords.length === 0}>
          {running ? "⏳ Bezig met versturen..." : "🚀 Start Outreach"}
        </button>

        {runError && <div className="error">{runError}</div>}
      </div>

      {(results.length > 0 || running) && (
        <div className="results">
          <h2>Results {startedAt && `— ${startedAt}`}</h2>
          <div className="results-list">
            {results.map((result, index) => (
              <div key={index} className={`result-item ${result.status}`}>
                <div className="result-seller">{result.seller}</div>
                {result.keyword && <div className="result-keyword">Keyword: {result.keyword}</div>}
                <div className="result-status">
                  {result.status === "sent" && "✓ Sent"}
                  {result.status === "failed" && "✗ Failed"}
                  {result.status === "skipped" && "⊘ Skipped"}
                </div>
                {result.reason && <div className="result-reason">{result.reason}</div>}
                <div className="result-time">{result.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/history" className="history-link">
        📜 Bekijk Geschiedenis
      </Link>

      <style jsx>{`
        .container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
        .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem; }
        .settings-button {
          padding: 0.75rem 1.5rem;
          background: #2563eb;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
        }
        .settings-button:hover { background: #1d4ed8; }
        .subtitle { color: #6b7280; margin-top: 0.5rem; }
        .warning-box {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: #92400e;
        }
        .info-box {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .info-box h3 { margin: 0 0 0.5rem 0; color: #1e3a8a; font-size: 1rem; }
        .info-grid { display: grid; gap: 0.25rem; color: #1e40af; font-size: 0.875rem; }
        .form { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .field { margin-bottom: 1.5rem; }
        .field label { display: block; font-weight: 500; margin-bottom: 0.5rem; color: #374151; }
        .field input[type="tel"], .field textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }
        .hint { font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem; }
        .keyword-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
        .keyword-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          background: #e5e7eb;
          color: #374151;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .keyword-button:hover { background: #d1d5db; }
        .keyword-button.selected { background: #2563eb; color: white; }
        button { width: 100%; padding: 1rem; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; }
        button:hover:not(:disabled) { background: #059669; }
        button:disabled { background: #9ca3af; cursor: not-allowed; }
        .error { margin-top: 1rem; padding: 1rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; color: #991b1b; }
        .results { margin-top: 2rem; background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .results h2 { margin: 0 0 1rem 0; }
        .results-list { display: grid; gap: 1rem; }
        .result-item { padding: 1rem; border-radius: 8px; border-left: 4px solid; }
        .result-item.sent { background: #d1fae5; border-color: #10b981; }
        .result-item.failed { background: #fee2e2; border-color: #ef4444; }
        .result-item.skipped { background: #f3f4f6; border-color: #6b7280; }
        .result-seller { font-weight: 600; margin-bottom: 0.25rem; }
        .result-keyword { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
        .result-status { font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
        .result-reason { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem; }
        .result-time { font-size: 0.75rem; color: #9ca3af; }
        .history-link { display: block; margin-top: 2rem; text-align: center; color: #2563eb; font-weight: 500; text-decoration: none; }
        .history-link:hover { text-decoration: underline; }
        .login { max-width: 400px; margin: 10rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .login h1 { text-align: center; margin-bottom: 1.5rem; }
        .login input { width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #d1d5db; border-radius: 8px; }
        .login button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .login button:hover { background: #1d4ed8; }
      `}</style>
    </div>
  );
}
