'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Result {
  id: number
  campaign_id: number
  seller: string
  keyword: string
  subject: string
  message: string
  name: string
  email: string
  phone: string
  timestamp: string
  status: 'sent' | 'failed' | 'skipped'
  reason: string | null
  campaign_started: string
}

interface Campaign {
  id: number
  started_at: string
  completed_at: string | null
  total_count: number
  sent_count: number
  failed_count: number
  skipped_count: number
}

export default function HistoryPage() {
  const [results, setResults] = useState<Result[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'results' | 'campaigns'>('results')

  const fetchData = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WORKFLOW_API_URL || ''
      
      if (!apiUrl) {
        setResults([])
        setCampaigns([])
        return
      }

      if (view === 'results') {
        const res = await fetch(`${apiUrl}/api/history?limit=100`)
        const data = await res.json()
        setResults(data.results || [])
      } else {
        const res = await fetch(`${apiUrl}/api/campaigns?limit=50`)
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [view])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <main className="shell" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <button type="button" style={{ padding: '0.5rem' }}>← Terug</button>
          </Link>
          <div>
            <h1 style={{ margin: 0 }}>Bericht geschiedenis</h1>
            <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>Bekijk alle verzonden berichten</p>
          </div>
          <button 
            type="button" 
            onClick={fetchData}
            style={{ marginLeft: 'auto', padding: '0.5rem 1rem' }}
          >
            ↻ Vernieuwen
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setView('results')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'results' ? 'var(--primary)' : 'transparent',
              color: view === 'results' ? 'white' : 'inherit',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Alle berichten
          </button>
          <button
            type="button"
            onClick={() => setView('campaigns')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'campaigns' ? 'var(--primary)' : 'transparent',
              color: view === 'campaigns' ? 'white' : 'inherit',
              border: '1px solid var(--border)',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Campagnes
          </button>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ opacity: 0.7 }}>Laden...</p>
          </div>
        ) : view === 'results' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ opacity: 0.7 }}>Geen berichten gevonden</p>
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <strong>{result.seller}</strong>
                        <span 
                          className={`badge ${result.status}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {result.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>{result.keyword}</span> · {result.subject}
                      </div>
                      {result.message && (
                        <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0.5rem 0', lineClamp: 2 }}>
                          {result.message}
                        </p>
                      )}
                      {result.reason && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--danger)', margin: '0.5rem 0 0' }}>
                          {result.reason}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.875rem', opacity: 0.7 }}>
                      <div>{formatDate(result.timestamp)}</div>
                      {result.name && <div style={{ fontSize: '0.75rem' }}>{result.name}</div>}
                      {result.email && <div style={{ fontSize: '0.75rem' }}>{result.email}</div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ opacity: 0.7 }}>Geen campagnes gevonden</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>
                        Campagne #{campaign.id}
                      </h3>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                        <div>
                          <span style={{ opacity: 0.7 }}>Totaal: </span>
                          <span style={{ fontWeight: 500 }}>{campaign.total_count}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7 }}>Verzonden: </span>
                          <span style={{ fontWeight: 500, color: 'var(--success)' }}>{campaign.sent_count}</span>
                        </div>
                        {campaign.failed_count > 0 && (
                          <div>
                            <span style={{ opacity: 0.7 }}>Mislukt: </span>
                            <span style={{ fontWeight: 500, color: 'var(--danger)' }}>{campaign.failed_count}</span>
                          </div>
                        )}
                        {campaign.skipped_count > 0 && (
                          <div>
                            <span style={{ opacity: 0.7 }}>Overgeslagen: </span>
                            <span style={{ fontWeight: 500, color: 'var(--warning)' }}>{campaign.skipped_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.875rem', opacity: 0.7 }}>
                      <div>Gestart: {formatDate(campaign.started_at)}</div>
                      {campaign.completed_at && (
                        <div>Voltooid: {formatDate(campaign.completed_at)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  )
}
