"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "./components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Play, StopCircle, CheckCircle2, XCircle, Clock, Tag, Settings2, AlertCircle } from "lucide-react";

type Result = {
  seller: string;
  keyword?: string;
  subject?: string;
  timestamp: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
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
  messageTemplates: MessageTemplate[];
  senderNames: string[];
  senderEmails: string[];
  senderPhones: string[];
  subject: string;
  sponsoredOnly: boolean;
}

export default function Home() {
  const [settings, setSettings] = useState<CampaignSettings | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [startedAt, setStartedAt] = useState("");
  const [runError, setRunError] = useState("");

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
      setSettings(parsed);
      setCustomSubject(parsed.subject || "");
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
                    className="cursor-pointer"
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
                {enabledTemplates.length} templates • {settings.senderNames.length} names • {settings.senderEmails.length} emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Messages per keyword</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.messagesPerKeyword}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Cooldown</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.cooldownMinutes} min</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-gray-600 mb-1">Sponsored only</p>
                  <p className="text-lg font-semibold text-gray-900">{settings.sponsoredOnly ? "Yes" : "No"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="subject">Custom subject line (optional)</Label>
                <Input
                  id="subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={settings.subject}
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
              <div className="flex gap-3">
                {!running ? (
                  <Button
                    onClick={startOutreach}
                    disabled={selectedKeywords.length === 0}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Campaign
                  </Button>
                ) : (
                  <Button
                    onClick={stopOutreach}
                    variant="destructive"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Campaign
                  </Button>
                )}
                <Link href="/history" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    <Clock className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

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
                        <thead className="border-b border-gray-200 bg-gray-50">
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
