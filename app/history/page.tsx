'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Image from 'next/image';

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
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Vercel Warning */}
        {isVercel && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Session-Only Storage</h3>
                <p className="mt-1 text-sm text-yellow-800">
                  On Vercel deployment, message history is stored in memory and only visible during the active campaign session. 
                  Data is lost when the server restarts. For persistent storage, run locally or connect a database (see DATABASE_ISSUE.md).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Totaal</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Verzonden</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.sent}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Mislukt</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{stats.failed}</div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="text-sm font-medium text-gray-600">Overgeslagen</div>
            <div className="mt-2 text-3xl font-bold text-gray-600">{stats.skipped}</div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bericht Geschiedenis</h1>
            <p className="mt-1 text-sm text-gray-600">Alle verzonden berichten met details</p>
          </div>
          <button
            onClick={fetchData}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ↻ Vernieuwen
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">Laden...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">Nog geen berichten verzonden</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
              Start je eerste campagne →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-md"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{log.shop_name}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            log.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.status === 'sent' ? '✓ Verzonden' : log.status === 'failed' ? '✗ Mislukt' : '⊘ Overgeslagen'}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div><span className="font-medium">Product:</span> {log.product_title}</div>
                        <div><span className="font-medium">Zoekwoord:</span> {log.keyword}</div>
                        <div><span className="font-medium">Onderwerp:</span> {log.subject}</div>
                        <div className="flex gap-4">
                          <span><span className="font-medium">Profiel:</span> {log.adspower_profile}</span>
                          {log.ip_address && <span><span className="font-medium">IP:</span> {log.ip_address}</span>}
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
                          <span className="font-medium">Fout:</span> {log.error_message}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {expandedId === log.id ? '↑ Minder details' : '↓ Meer details'}
                      </button>

                      {expandedId === log.id && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          <div>
                            <div className="text-xs font-medium uppercase text-gray-500">Bericht</div>
                            <div className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                              {log.message}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs font-medium uppercase text-gray-500">Afzender</div>
                              <div className="mt-1 text-gray-700">{log.sender_name}</div>
                              <div className="text-gray-600">{log.sender_email}</div>
                              {log.sender_phone && <div className="text-gray-600">{log.sender_phone}</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col items-end gap-3">
                      <div className="text-right text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </div>
                      
                      {log.screenshot_path && (
                        <div className="relative h-32 w-48 overflow-hidden rounded-md border border-gray-200">
                          <Image
                            src={log.screenshot_path}
                            alt="Screenshot"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
