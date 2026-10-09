'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Save, Settings2, Tag, Users, Mail, MessageSquare, Info } from 'lucide-react';

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

const DEFAULT_SETTINGS: CampaignSettings = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje'],
  cooldownMinutes: 5,
  messagesPerKeyword: 8,
  messageSpreadMinutes: 3,
  messageTemplates: [
    {
      id: '1',
      name: 'Standaard vraag',
      content: 'Beste {{sellerName}},\n\nIk ben geïnteresseerd in uw product "{{productTitle}}" en zou graag meer informatie willen ontvangen.\n\nMet vriendelijke groet,\n{{senderName}}',
      enabled: true,
    },
    {
      id: '2',
      name: 'Bulk prijzen',
      content: 'Hallo {{sellerName}},\n\nIk zoek een betrouwbare leverancier voor {{productTitle}}. Kunt u mij informatie sturen over bulkprijzen?\n\nGroeten,\n{{senderName}}',
      enabled: true,
    },
  ],
  senderNames: [
    'Clara Fischer',
    'Kaja Blum',
    'Simon de Vries',
    'Emma van der Berg',
    'Lars Janssen'
  ],
  senderEmails: [
    'clara@marktplatzranking.de',
    'clara.fischer@marktplatzranking.de',
    'kaja@erfolgimmarkt.de',
    'kaja.blum@marketinsiders.org',
    'kaja.blum@erfolgimmarkt.de',
    'kaja@marketinsiders.org',
    'simon@marketinsiders.org',
    'contact@marketrankconsult.com',
    'marketplace@marketrankconsult.com',
    'sales@marketrankconsult.com'
  ],
  senderPhones: [
    '0612345678',
    '0687654321',
    '0698765432',
    '0623456789',
    '0634567890'
  ],
  subject: 'Vraag over product',
  sponsoredOnly: false,
  recurringEnabled: false,
  recurringIntervalDays: 7,
  recurringEndDate: '',
  monthlyKeywords: {
    '1': ['verwarmingselement', 'elektrische deken', 'luchtbevochtiger', 'thermosfles', 'winterjas', 'handschoenen', 'muts', 'sjaal', 'snowboard', 'skibril'],
    '2': ['verwarmingselement', 'elektrische deken', 'luchtbevochtiger', 'thermosfles', 'winterjas', 'handschoenen', 'muts', 'sjaal', 'snowboard', 'skibril'],
    '3': ['tuinmeubelen', 'parasol', 'bbq', 'plantenbak', 'tuingereedschap', 'regenpak', 'laarzen', 'paraplu', 'bloembollen', 'tuinslang'],
    '4': ['tuinmeubelen', 'parasol', 'bbq', 'zwembad', 'luchtbed', 'strandlaken', 'koelbox', 'picknickmand', 'camping tent', 'slaapzak'],
    '5': ['tuinmeubelen', 'parasol', 'bbq', 'zwembad', 'luchtbed', 'strandlaken', 'koelbox', 'picknickmand', 'camping tent', 'ventilator'],
    '6': ['zwembad', 'luchtbed', 'strandlaken', 'zonnebrand', 'koelbox', 'ventilator', 'airco', 'tuinsproeier', 'waterfilter', 'ijsblokjesvorm'],
    '7': ['zwembad', 'luchtbed', 'strandlaken', 'zonnebrand', 'koelbox', 'ventilator', 'airco', 'tuinsproeier', 'waterfilter', 'ijsblokjesvorm'],
    '8': ['zwembad', 'luchtbed', 'strandlaken', 'zonnebrand', 'koelbox', 'ventilator', 'rugzak', 'waterfles', 'sportschoenen', 'fietsverlichting'],
    '9': ['rugzak', 'schooltas', 'thermoskan', 'regenjas', 'paraplu', 'planner', 'bureaulamp', 'laptop sleeve', 'powerbank', 'usb kabel'],
    '10': ['verwarmingselement', 'elektrische deken', 'thermoskan', 'regenjas', 'paraplu', 'led verlichting', 'kaarsen', 'waxinelichtjes', 'lantaarn', 'accu'],
    '11': ['verwarmingselement', 'elektrische deken', 'luchtbevochtiger', 'thermoskan', 'winterjas', 'handschoenen', 'muts', 'sjaal', 'kerstverlichting', 'cadeaupapier'],
    '12': ['kerstverlichting', 'cadeaupapier', 'kerstboom', 'kerstballen', 'adventkalender', 'chocolade', 'speelgoed', 'puzzel', 'bordspel', 'oliebollen vorm'],
  },
};

const PLACEHOLDERS = [
  { key: '{{sellerName}}', description: 'Naam van de verkoper' },
  { key: '{{productTitle}}', description: 'Titel van het product' },
  { key: '{{keyword}}', description: 'Zoekwoord' },
  { key: '{{senderName}}', description: 'Uw naam' },
  { key: '{{senderEmail}}', description: 'Uw email' },
  { key: '{{senderPhone}}', description: 'Uw telefoonnummer' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<CampaignSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [newMonthlyKeyword, setNewMonthlyKeyword] = useState('');

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
      
      // Add monthly keywords if missing
      if (!parsed.monthlyKeywords) {
        parsed.monthlyKeywords = DEFAULT_SETTINGS.monthlyKeywords;
      }
      
      setSettings(parsed);
    }
  }, []);

  const saveSettings = async () => {
    localStorage.setItem('campaignSettings', JSON.stringify(settings));
    
    // If recurring is enabled, save to database
    if (settings.recurringEnabled) {
      try {
        const response = await fetch('/api/recurring-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'BOL Campaign',
            enabled: settings.recurringEnabled,
            interval_days: settings.recurringIntervalDays,
            end_date: settings.recurringEndDate || null,
            settings: settings,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to save recurring campaign to database');
        }
      } catch (error) {
        console.error('Error saving recurring campaign:', error);
      }
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setSettings({ ...settings, keywords: [...settings.keywords, newKeyword.trim()] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings({ ...settings, keywords: settings.keywords.filter((k) => k !== keyword) });
  };

  const addTemplate = () => {
    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name: 'Nieuw Template',
      content: 'Beste {{sellerName}},\n\n...\n\nMet vriendelijke groet,\n{{senderName}}',
      enabled: true,
    };
    setSettings({ ...settings, messageTemplates: [...settings.messageTemplates, newTemplate] });
  };

  const removeTemplate = (id: string) => {
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.filter((t) => t.id !== id),
    });
  };

  const toggleTemplate = (id: string) => {
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.map((t) =>
        t.id === id ? { ...t, enabled: !t.enabled } : t
      ),
    });
  };

  const startEditTemplate = (id: string, name: string, content: string) => {
    setEditingTemplate(id);
    setEditName(name);
    setEditContent(content);
  };

  const saveEditTemplate = () => {
    if (editingTemplate) {
      setSettings({
        ...settings,
        messageTemplates: settings.messageTemplates.map((t) =>
          t.id === editingTemplate ? { ...t, name: editName, content: editContent } : t
        ),
      });
      setEditingTemplate(null);
    }
  };

  const cancelEditTemplate = () => {
    setEditingTemplate(null);
  };

  const toggleSelectAll = () => {
    const allEnabled = settings.messageTemplates.every((t) => t.enabled);
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.map((t) => ({ ...t, enabled: !allEnabled })),
    });
  };

  const addMonthlyKeyword = () => {
    if (newMonthlyKeyword.trim()) {
      const currentKeywords = settings.monthlyKeywords?.[selectedMonth] || [];
      if (currentKeywords.length < 10) {
        setSettings({
          ...settings,
          monthlyKeywords: {
            ...settings.monthlyKeywords,
            [selectedMonth]: [...currentKeywords, newMonthlyKeyword.trim()],
          },
        });
        setNewMonthlyKeyword('');
      }
    }
  };

  const removeMonthlyKeyword = (month: string, keyword: string) => {
    const currentKeywords = settings.monthlyKeywords?.[month] || [];
    setSettings({
      ...settings,
      monthlyKeywords: {
        ...settings.monthlyKeywords,
        [month]: currentKeywords.filter((k) => k !== keyword),
      },
    });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
  ];

  const enabledCount = settings.messageTemplates.filter((t) => t.enabled).length;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings2 className="h-6 w-6 text-gray-900" />
            <h1 className="text-2xl font-semibold text-gray-900">Campaign Settings</h1>
          </div>
          <p className="text-sm text-gray-600">
            Configure your BOL.nl seller outreach campaigns
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-900">Settings saved successfully</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Keywords Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Search Keywords</CardTitle>
              </div>
              <CardDescription>
                Keywords to find sellers on BOL.nl ({settings.keywords.length} active)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="e.g. powerbank, usb cable..."
                  className="flex-1"
                />
                <Button onClick={addKeyword} size="default">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {settings.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 rounded-sm hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Seasonal Keywords Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Seasonal Keywords (per maand)</CardTitle>
              </div>
              <CardDescription>
                Stel 10 seizoensgebonden keywords in voor elke maand. Deze worden automatisch voorgeselecteerd op het dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Month Selector */}
              <div>
                <Label className="mb-2 block">Selecteer maand</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {monthNames.map((name, index) => {
                    const monthNum = (index + 1).toString();
                    const count = settings.monthlyKeywords?.[monthNum]?.length || 0;
                    return (
                      <option key={monthNum} value={monthNum}>
                        {name} ({count}/10 keywords)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Add Keyword Input */}
              <div className="flex gap-2">
                <Input
                  value={newMonthlyKeyword}
                  onChange={(e) => setNewMonthlyKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMonthlyKeyword()}
                  placeholder={`Keyword toevoegen voor ${monthNames[parseInt(selectedMonth) - 1]}...`}
                  className="flex-1"
                  disabled={(settings.monthlyKeywords?.[selectedMonth]?.length || 0) >= 10}
                />
                <Button 
                  onClick={addMonthlyKeyword} 
                  size="default"
                  disabled={(settings.monthlyKeywords?.[selectedMonth]?.length || 0) >= 10}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* Current Month Keywords */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">
                    {monthNames[parseInt(selectedMonth) - 1]} keywords ({settings.monthlyKeywords?.[selectedMonth]?.length || 0}/10)
                  </Label>
                  {(settings.monthlyKeywords?.[selectedMonth]?.length || 0) >= 10 && (
                    <span className="text-xs text-amber-600">Maximum bereikt</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(settings.monthlyKeywords?.[selectedMonth] || []).map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                      {keyword}
                      <button
                        onClick={() => removeMonthlyKeyword(selectedMonth, keyword)}
                        className="ml-1 rounded-sm hover:bg-gray-200 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(settings.monthlyKeywords?.[selectedMonth]?.length || 0) === 0 && (
                    <p className="text-sm text-gray-500">Nog geen keywords voor deze maand</p>
                  )}
                </div>
              </div>

              {/* Season Info */}
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
                <p className="font-medium mb-1">💡 Seizoen tips:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Winter (dec-feb):</strong> Verwarmingsproducten, kerstartikelen, winterkleding</li>
                  <li><strong>Lente (mrt-mei):</strong> Tuinproducten, BBQ, buitenspeelgoed (verkoop zomerproducten!)</li>
                  <li><strong>Zomer (jun-aug):</strong> Zwembaden, koelboxen, ventilators, strandartikelen</li>
                  <li><strong>Herfst (sep-nov):</strong> Schoolartikelen, regenjassen, herfstdecoratie</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Campaign Parameters</CardTitle>
              </div>
              <CardDescription>Configure campaign behavior and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Sponsored products only</Label>
                  <p className="text-sm text-gray-600">
                    Only contact sellers with sponsored (paid) ads
                  </p>
                </div>
                <Switch
                  checked={settings.sponsoredOnly}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, sponsoredOnly: checked })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown between keywords (minutes)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.cooldownMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) || 1 })
                    }
                  />
                  <p className="text-xs text-gray-600">Wait time between processing keywords</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messages">Messages per keyword</Label>
                  <Input
                    id="messages"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.messagesPerKeyword}
                    onChange={(e) =>
                      setSettings({ ...settings, messagesPerKeyword: parseInt(e.target.value) || 1 })
                    }
                  />
                  <p className="text-xs text-gray-600">Target: successfully contact this many sellers (skips don't count)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="messageSpread">Message spread timing (minutes)</Label>
                <Input
                  id="messageSpread"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.messageSpreadMinutes}
                  onChange={(e) =>
                    setSettings({ ...settings, messageSpreadMinutes: parseInt(e.target.value) || 1 })
                  }
                />
                <p className="text-xs text-gray-600">Wait time between each message to appear more natural</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sponsored-only">Sponsored listings only</Label>
                    <p className="text-xs text-gray-600">Only contact sellers with sponsored products</p>
                  </div>
                  <Switch
                    id="sponsored-only"
                    checked={settings.sponsoredOnly}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sponsoredOnly: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Campaigns */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Recurring Campaigns</CardTitle>
              </div>
              <CardDescription>Automatically run campaigns on a schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recurring-enabled">Enable recurring campaigns</Label>
                  <p className="text-xs text-gray-600">Run this campaign automatically</p>
                </div>
                <Switch
                  id="recurring-enabled"
                  checked={settings.recurringEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, recurringEnabled: checked })
                  }
                />
              </div>

              {settings.recurringEnabled && (
                <>
                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recurring-interval">Run every (days)</Label>
                      <Input
                        id="recurring-interval"
                        type="number"
                        min="1"
                        max="90"
                        value={settings.recurringIntervalDays}
                        onChange={(e) =>
                          setSettings({ ...settings, recurringIntervalDays: parseInt(e.target.value) || 1 })
                        }
                      />
                      <p className="text-xs text-gray-600">Campaign will run every X days</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurring-end-date">End date</Label>
                      <Input
                        id="recurring-end-date"
                        type="date"
                        value={settings.recurringEndDate}
                        onChange={(e) =>
                          setSettings({ ...settings, recurringEndDate: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-600">Stop recurring after this date</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">How it works:</p>
                        <ul className="space-y-1 pl-4 list-disc">
                          <li>Campaign runs automatically every {settings.recurringIntervalDays} day(s)</li>
                          <li>Respects cooldown rules (won't contact sellers contacted in last 6 months)</li>
                          <li>Stops automatically on {settings.recurringEndDate || 'end date'}</li>
                          <li>You'll receive email notifications for each run</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Sender Information</CardTitle>
              </div>
              <CardDescription>Contact details randomly rotated per message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Names */}
              <div className="space-y-3">
                <Label>Names ({settings.senderNames.length})</Label>
                {settings.senderNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => {
                        const newNames = [...settings.senderNames];
                        newNames[index] = e.target.value;
                        setSettings({ ...settings, senderNames: newNames });
                      }}
                      placeholder="e.g. Clara Fischer"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newNames = settings.senderNames.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderNames: newNames });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSettings({ ...settings, senderNames: [...settings.senderNames, ''] })
                  }
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add name
                </Button>
              </div>

              <Separator />

              {/* Emails */}
              <div className="space-y-3">
                <Label>Email addresses ({settings.senderEmails.length})</Label>
                {settings.senderEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...settings.senderEmails];
                        newEmails[index] = e.target.value;
                        setSettings({ ...settings, senderEmails: newEmails });
                      }}
                      placeholder="e.g. clara@marktplatzranking.de"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newEmails = settings.senderEmails.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderEmails: newEmails });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSettings({ ...settings, senderEmails: [...settings.senderEmails, ''] })
                  }
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add email
                </Button>
              </div>

              <Separator />

              {/* Phone Numbers */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Label>Phone numbers ({settings.senderPhones.length})</Label>
                  <span className="text-xs text-gray-600">Optional</span>
                </div>
                <p className="text-xs text-gray-600">
                  If empty, a random 06-number will be generated (06XXXXXXXX)
                </p>
                {settings.senderPhones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const newPhones = [...settings.senderPhones];
                        newPhones[index] = e.target.value;
                        setSettings({ ...settings, senderPhones: newPhones });
                      }}
                      placeholder="e.g. 0612345678"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newPhones = settings.senderPhones.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderPhones: newPhones });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSettings({ ...settings, senderPhones: [...settings.senderPhones, ''] })
                  }
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add phone
                </Button>
              </div>

              <Separator />

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Default subject line</Label>
                <Input
                  id="subject"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  placeholder="e.g. Question about product"
                />
                <p className="text-xs text-gray-600">
                  Can be overridden per campaign on the Dashboard page
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Message Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-700" />
                    <CardTitle className="text-base">Message Templates</CardTitle>
                  </div>
                  <CardDescription>
                    {enabledCount} of {settings.messageTemplates.length} templates enabled
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {settings.messageTemplates.every((t) => t.enabled) ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.messageTemplates.map((template) => (
                <div key={template.id} className="rounded-lg border border-gray-200">
                  {editingTemplate === template.id ? (
                    <div className="p-4 space-y-4">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Template name"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Message content..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveEditTemplate} size="sm">
                          Save
                        </Button>
                        <Button variant="outline" onClick={cancelEditTemplate} size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.enabled}
                            onCheckedChange={() => toggleTemplate(template.id)}
                          />
                          <span className="font-medium text-sm">{template.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditTemplate(template.id, template.name, template.content)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTemplate(template.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-700 border border-gray-200">
                        {template.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={addTemplate} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add new template
              </Button>
            </CardContent>
          </Card>

          {/* Available Variables */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-base">Available Variables</CardTitle>
              </div>
              <CardDescription>Use these in your message templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {PLACEHOLDERS.map((placeholder) => (
                  <div key={placeholder.key} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {placeholder.key}
                    </code>
                    <span className="text-xs text-gray-600">{placeholder.description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Save Button */}
        <div className="fixed bottom-6 right-6">
          <Button onClick={saveSettings} size="lg" className="shadow-lg">
            <Save className="mr-2 h-4 w-4" />
            Save settings
          </Button>
        </div>
      </main>
    </div>
  );
}
