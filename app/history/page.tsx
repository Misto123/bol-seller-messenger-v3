'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  History as HistoryIcon,
  ArrowLeft,
  Mail,
  User,
  Phone,
  Tag,
  Globe
} from 'lucide-react';

interface MessageLog {
  id: number;
  shop_name: string;
  product_title: string;
  keyword: string;
  message: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string;
  screenshot_path: string | null;
  adspower_profile: string;
  ip_address: string | null;
  status: 'sent' | 'failed' | 'skipped';
  error_message: string | null;
  timestamp: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, skipped: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/history?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || { total: 0, sent: 0, failed: 0, skipped: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <HistoryIcon className="h-6 w-6 text-gray-900" />
              <h1 className="text-2xl font-semibold text-gray-900">Campaign History</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            All sent messages with detailed logs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-2">Total</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-2">Sent</div>
              <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-2">Failed</div>
              <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 mb-2">Skipped</div>
              <div className="text-3xl font-bold text-gray-600">{stats.skipped}</div>
            </CardContent>
          </Card>
        </div>

        {/* Message Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message Log</CardTitle>
            <CardDescription>
              {logs.length} messages in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-8 text-center">
                <HistoryIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No messages yet</p>
                <p className="text-sm text-gray-600">
                  Start a campaign from the Dashboard to see logs here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    {/* Collapsed View */}
                    <div
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Status */}
                        <div className="flex-shrink-0">
                          {log.status === 'sent' && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                          )}
                          {log.status === 'failed' && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                              <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                          )}
                          {log.status === 'skipped' && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                              <Clock className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {log.shop_name}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {log.keyword}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {log.product_title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(log.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="flex-shrink-0 ml-4">
                        {expandedId === log.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedId === log.id && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                        {/* Sender Info */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Sender Information</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{log.sender_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{log.sender_email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{log.sender_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{log.ip_address || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Message Content */}
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Message</h4>
                          <div className="rounded-md bg-white border border-gray-200 p-3">
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              Subject: {log.subject}
                            </p>
                            <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans">
                              {log.message}
                            </pre>
                          </div>
                        </div>

                        {/* Screenshot */}
                        {log.screenshot_path && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-700 mb-2">Screenshot</h4>
                            <div className="rounded-md border border-gray-200 overflow-hidden">
                              <Image
                                src={log.screenshot_path}
                                alt="Message screenshot"
                                width={800}
                                height={600}
                                className="w-full h-auto"
                              />
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {log.error_message && (
                          <div className="rounded-md border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-medium text-red-900 mb-1">Error</p>
                            <p className="text-xs text-red-700">{log.error_message}</p>
                          </div>
                        )}

                        {/* Technical Details */}
                        <div className="text-xs text-gray-600">
                          <p>Profile: {log.adspower_profile}</p>
                          <p>ID: {log.id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
