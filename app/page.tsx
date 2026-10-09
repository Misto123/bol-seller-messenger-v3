"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  StopCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Tag, 
  Settings2, 
  AlertCircle,
  Loader2,
  Mail,
  ExternalLink,
  Info,
  History as HistoryIcon,
  Eye
} from "lucide-react";

type Result = {
  seller: string;
  keyword?: string;
  subject?: string;
  timestamp: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
};

type DryRunPreview = {
  keyword: string;
  seller?: string;
  productTitle?: string;
  productUrl?: string;
  sponsored?: boolean;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  subject?: string;
  message?: string;
  duplicate?: boolean;
  status: "ready_to_send" | "would_skip_duplicate" | "duplicate_check_unavailable" | "search_failed";
  unresolvedVariables?: string[];
  error?: string;
};

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
}

interface CampaignSettings {
  keywords: string[];
  cooldownMinutes: number;
  messagesPerKeyword: number;
  messageSpreadMinutes: number;
  messageTemplates: MessageTemplate[];
  senderNames: string[];
  senderEmails: string[];
  senderPhones: string[];
  subject: string;
  sponsoredOnly: boolean;
  recurringEnabled: boolean;
  recurringIntervalDays: number;
  recurringEndDate: string;
  monthlyKeywords?: Record<string, string[]>; // month 1-12 -> up to 10 keywords
}

export default function Home() {
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [startedAt, setStartedAt] = useState("");
  const [runError, setRunError] = useState("");
  const [campaignStarted, setCampaignStarted] = useState(false);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunError, setDryRunError] = useState("");
  const [dryRunPreviews, setDryRunPreviews] = useState<DryRunPreview[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('campaignSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old format to new format if needed
      if (parsed.messageTemplates && typeof parsed.messageTemplates[0] === 'string') {
        parsed.messageTemplates = parsed.messageTemplates.map((content: string, index: number) => ({
          id: `${Date.now()}-${index}`,
          name: `Template ${index + 1}`,
          content,
          enabled: true,
        }));
      }
      // Migrate old single sender fields to arrays
      if (parsed.senderName && !parsed.senderNames) {
        parsed.senderNames = [parsed.senderName];
        delete parsed.senderName;
      }
      if (parsed.senderEmail && !parsed.senderEmails) {
        parsed.senderEmails = [parsed.senderEmail];
        delete parsed.senderEmail;
      }
      if (parsed.senderPhone && !parsed.senderPhones) {
        parsed.senderPhones = [parsed.senderPhone];
        delete parsed.senderPhone;
      }
      // Migrate to add new fields with defaults
      if (parsed.messageSpreadMinutes === undefined) {
        parsed.messageSpreadMinutes = 3;
      }
      if (parsed.recurringEnabled === undefined) {
        parsed.recurringEnabled = false;
        parsed.recurringIntervalDays = 7;
        parsed.recurringEndDate = '';
      }
      if (!parsed.monthlyKeywords) {
        parsed.monthlyKeywords = {};
      }
      setSettings(parsed);
      setCustomSubject(parsed.subject || "");

      // Auto-select current month's seasonal keywords as defaults
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const monthKey = currentMonth.toString();
      const monthlyDefaults = parsed.monthlyKeywords?.[monthKey] || [];
      if (monthlyDefaults.length > 0) {
        setSelectedKeywords(monthlyDefaults);
      }
    }
  }, []);

  async function startOutreach() {
    if (!settings) {
      setRunError("No settings found. Go to Settings to configure.");
      return;
    }

    if (selectedKeywords.length === 0) {
      setRunError("Select at least one keyword");
      return;
    }

    setRunning(true);
    setCampaignStarted(true);
    setRunError("");
    setResults([]);
    setStartedAt(new Date().toLocaleString('nl-NL'));

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords,
          cooldownMinutes: settings.cooldownMinutes,
          messagesPerKeyword: settings.messagesPerKeyword,
          messageSpreadMinutes: settings.messageSpreadMinutes,
          messageTemplates: settings.messageTemplates,
          senderNames: settings.senderNames,
          senderEmails: settings.senderEmails,
          senderPhones: settings.senderPhones,
          subject: customSubject || settings.subject,
          sponsoredOnly: settings.sponsoredOnly,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRunError(data.error || "Er ging iets mis");
        setRunning(false);
        return;
      }

      setResults(data.results || []);

      // Save to history
      const historyItem = {
        timestamp: new Date().toISOString(),
        keywords: selectedKeywords,
        subject: customSubject || settings.subject,
        results: data.results || [],
        settings: {
          cooldownMinutes: settings.cooldownMinutes,
          messagesPerKeyword: settings.messagesPerKeyword,
          sponsoredOnly: settings.sponsoredOnly,
        },
      };

      const history = JSON.parse(localStorage.getItem("campaignHistory") || "[]");
      history.unshift(historyItem);
      localStorage.setItem("campaignHistory", JSON.stringify(history.slice(0, 50)));

    } catch (error) {
      console.error("Error:", error);
      setRunError("Network error or server unavailable");
    } finally {
      setRunning(false);
    }
  }

  async function runDryRun() {
    if (!settings || selectedKeywords.length === 0) return;
    setDryRunLoading(true);
    setDryRunError("");
    setDryRunPreviews([]);
    try {
      const response = await fetch("/api/qa/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: selectedKeywords,
          messageTemplates: settings.messageTemplates,
          senderNames: settings.senderNames,
          senderEmails: settings.senderEmails,
          senderPhones: settings.senderPhones,
          subject: customSubject || settings.subject,
          sponsoredOnly: settings.sponsoredOnly,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(JSON.stringify({
          httpStatus: response.status,
          error: data.error || "Dry run failed",
          diagnostics: data.diagnostics || null,
        }, null, 2));
      }
      setDryRunPreviews(data.previews || []);
    } catch (error) {
      setDryRunError(error instanceof Error ? error.message : "Dry run failed");
    } finally {
      setDryRunLoading(false);
    }
  }

  function stopOutreach() {
    setRunning(false);
  }

  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };

  const selectAllKeywords = () => {
    if (settings) {
      setSelectedKeywords([...settings.keywords]);
    }
  };

  const deselectAllKeywords = () => {
    setSelectedKeywords([]);
  };

  const sentCount = results.filter((r) => r.status === "sent").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  if (!settings) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                No settings configured
              </CardTitle>
              <CardDescription>
                Configure your campaign settings before starting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Go to Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const enabledTemplates = settings.messageTemplates.filter((t) => t.enabled);
  const uniqueEmails = [...new Set(settings.senderEmails)];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Campaign Dashboard</h1>
          <p className="text-sm text-gray-600">
            Start and monitor your BOL.nl seller outreach campaigns
          </p>
        </div>

        {/* Error Message */}
        {runError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">{runError}</p>
            </div>
          </div>
        )}

        {dryRunError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-900 mb-2">Safe QA preview failed. Full diagnostics:</p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-red-900">{dryRunError}</pre>
          </div>
        )}

        {/* Campaign Running Info */}
        {running && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Campaign Running...
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>✓ You can safely close this page - the campaign continues on the server</p>
                    <p>✓ Check back anytime or view results in History when complete</p>
                    <p>✓ AdsPower browser will automatically close when finished</p>
                    <p>✓ Estimated time: ~{Math.ceil(
                      selectedKeywords.length * (
                        settings.messagesPerKeyword * settings.messageSpreadMinutes + 
                        settings.cooldownMinutes
                      )
                    )} minutes</p>
                    <p className="text-xs italic">Includes {settings.messageSpreadMinutes} min between each message</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Info - After Campaign Completes */}
        {campaignStarted && !running && sentCount > 0 && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-green-900 mb-2">
                    Campaign Complete! {sentCount} Messages Sent
                  </h3>
                  <div className="space-y-3 text-sm text-green-800">
                    <p className="font-medium">✓ Check your inbox for seller replies:</p>
                    <div className="space-y-1.5 pl-4">
                      {uniqueEmails.map((email) => (
                        <div key={email} className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <a
                            href={`https://purelymail.com/manage/account/login`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-900 hover:text-green-700 underline font-medium flex items-center gap-1"
                          >
                            {email}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Next Steps:</p>
                        <ul className="space-y-1 pl-4 list-disc">
                          <li>Login to <a href="https://purelymail.com" target="_blank" rel="noopener noreferrer" className="underline">purelymail.com</a> to check replies</li>
                          <li>View full details in <Link href="/history" className="underline">History</Link></li>
                          <li>Screenshots are saved in the database (check History page)</li>
                          <li>AdsPower browser has been closed automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Keywords Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-700" />
                    <CardTitle className="text-base">Select Keywords</CardTitle>
                  </div>
                  <CardDescription>
                    {selectedKeywords.length} of {settings.keywords.length} keywords selected
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllKeywords}>
                    Select all
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAllKeywords}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {settings.keywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5 text-sm"
                    onClick={() => toggleKeyword(kw)}
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Campaign Configuration</CardTitle>
              </div>
              <CardDescription>
                {enabledTemplates.length} templates • {settings.senderNames.length} names • {uniqueEmails.length} email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4 text-sm">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Target per keyword</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.messagesPerKeyword}</p>
                  <p className="text-xs text-gray-500 mt-1">Successful contacts</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Message spread</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.messageSpreadMinutes} min</p>
                  <p className="text-xs text-gray-500 mt-1">Between messages</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Cooldown</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.cooldownMinutes} min</p>
                  <p className="text-xs text-gray-500 mt-1">Between keywords</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Sponsored only</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.sponsoredOnly ? "Yes" : "No"}</p>
                  <p className="text-xs text-gray-500 mt-1">Filter type</p>
                </div>
              </div>

              {settings.recurringEnabled && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <p className="font-medium mb-1">🔁 Recurring Campaign Active</p>
                        <p>Runs automatically every {settings.recurringIntervalDays} day(s) until {settings.recurringEndDate || 'end date'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="subject">Custom subject line (optional)</Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={settings.subject}
                  disabled={running}
                />
                <p className="text-xs text-gray-600">
                  Leave empty to use default: "{settings.subject}"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Control</CardTitle>
              <CardDescription>
                Start your outreach campaign when ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                {!running ? (
                  <Button
                    onClick={startOutreach}
                    disabled={selectedKeywords.length === 0}
                    size="lg"
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Campaign
                  </Button>
                ) : (
                  <Button
                    onClick={stopOutreach}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Campaign
                  </Button>
                )}
                <Link href="/history" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full">
                    <HistoryIcon className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={runDryRun}
                  disabled={selectedKeywords.length === 0 || running || dryRunLoading}
                  title="Searches and previews only. Does not send messages or write history."
                >
                  {dryRunLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                  {dryRunLoading ? "Checking safely…" : "Safe QA preview"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Safe QA preview searches selected keywords and previews rendered messages. It never submits messages or adds history records.
              </p>
            </CardContent>
          </Card>

          {dryRunPreviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Safe QA Preview</CardTitle>
                <CardDescription>
                  {dryRunPreviews.length} seller preview(s). 0 messages sent; 0 history records written.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dryRunPreviews.map((preview, index) => (
                  <div key={`${preview.keyword}-${preview.seller || "error"}-${index}`} className="rounded-lg border border-gray-200 p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={preview.status === "ready_to_send" ? "default" : preview.status === "would_skip_duplicate" ? "secondary" : "destructive"}>
                        {preview.status === "ready_to_send" ? "Ready — not sent" : preview.status === "would_skip_duplicate" ? "Would skip: recently contacted" : preview.status === "duplicate_check_unavailable" ? "Duplicate status unavailable" : "Search failed"}
                      </Badge>
                      <span className="text-xs text-gray-600">Keyword: {preview.keyword}</span>
                    </div>
                    {preview.error ? (
                      <p className="text-sm text-red-700">{preview.error}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-900"><strong>Seller:</strong> {preview.seller}</p>
                        <p className="text-sm text-gray-900"><strong>Product:</strong> {preview.productTitle}</p>
                        <p className="text-sm text-gray-600"><strong>Sender:</strong> {preview.senderName} · {preview.senderEmail}</p>
                        <p className="text-sm text-gray-600"><strong>Subject:</strong> {preview.subject}</p>
                        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 border border-gray-200 p-3 text-xs text-gray-800 font-sans">{preview.message}</pre>
                        {preview.unresolvedVariables && preview.unresolvedVariables.length > 0 && (
                          <p className="text-sm text-red-700">Unresolved template variables: {preview.unresolvedVariables.join(", ")}</p>
                        )}
                        {preview.productUrl && <a href={preview.productUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">Open product page</a>}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Results</CardTitle>
                <CardDescription>Started at {startedAt}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Sent</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{sentCount}</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-900">Failed</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{failedCount}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-900">Skipped</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{skippedCount}</p>
                  </div>
                </div>

                <Separator />

                {/* Results Table */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Details</h3>
                  <div className="rounded-lg border border-gray-200">
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Seller</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Keyword</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {results.map((result, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                {result.status === "sent" && (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Sent
                                  </Badge>
                                )}
                                {result.status === "failed" && (
                                  <Badge variant="destructive">
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                                {result.status === "skipped" && (
                                  <Badge variant="secondary">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Skipped
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-900">{result.seller}</td>
                              <td className="px-4 py-3 text-gray-600">{result.keyword}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{result.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
