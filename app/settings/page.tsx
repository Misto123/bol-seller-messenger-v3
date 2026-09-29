'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';

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

const DEFAULT_SETTINGS: CampaignSettings = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje'],
  cooldownMinutes: 5,
  messagesPerKeyword: 8,
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
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('campaignSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings({
        ...settings,
        keywords: [...settings.keywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      keywords: settings.keywords.filter((k) => k !== keyword),
    });
  };

  const addTemplate = () => {
    const newTemplate: MessageTemplate = {
      id: `${Date.now()}`,
      name: 'Nieuw Template',
      content: '',
      enabled: true,
    };
    setSettings({
      ...settings,
      messageTemplates: [...settings.messageTemplates, newTemplate],
    });
    startEditTemplate(newTemplate.id, 'Nieuw Template', '');
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

  const selectAllTemplates = () => {
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.map((t) => ({ ...t, enabled: true })),
    });
  };

  const deselectAllTemplates = () => {
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.map((t) => ({ ...t, enabled: false })),
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

  const insertPlaceholder = (placeholder: string) => {
    setEditContent(editContent + placeholder);
  };

  const enabledCount = settings.messageTemplates.filter((t) => t.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-8 shadow-xl text-white">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Campagne Instellingen</h1>
              <p className="mt-1 text-blue-100">Configureer uw BOL.nl verkoper outreach campagnes</p>
            </div>
          </div>
        </div>

        {saved && (
          <div className="mb-6 animate-fade-in rounded-lg bg-green-50 border-2 border-green-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-900">Instellingen opgeslagen!</p>
                <p className="text-sm text-green-700">Je campagne instellingen zijn succesvol bijgewerkt</p>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Section */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg border border-gray-200">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Zoekwoorden</h2>
              <p className="text-sm text-gray-600">
                Voeg zoekwoorden toe waarmee u verkopers wilt vinden op BOL.nl ({settings.keywords.length} actief)
              </p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="bijv. powerbank, usb kabel..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={addKeyword}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
            >
              Toevoegen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-blue-800"
              >
                <span>{keyword}</span>
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Settings */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg border border-gray-200">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Campagne Instellingen</h2>
              <p className="text-sm text-gray-600">Stel campagne parameters in</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-purple-50 p-4 border border-purple-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sponsoredOnly}
                  onChange={(e) =>
                    setSettings({ ...settings, sponsoredOnly: e.target.checked })
                  }
                  className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Alleen gesponsorde producten contacteren</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Wanneer aangevinkt, worden alleen verkopers van gesponsorde (betaalde) advertenties
                    gecontacteerd. Deze verkopers hebben budget voor marketing en zijn vaak meer open
                    voor partnerships.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  ⏱️ Cooldown tussen zoekwoorden (minuten)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.cooldownMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500"
                style={{ minHeight: '44px' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Wachttijd tussen het verwerken van verschillende zoekwoorden
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                📧 Aantal berichten per zoekwoord
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.messagesPerKeyword}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    messagesPerKeyword: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500"
                style={{ minHeight: '44px' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                Hoeveel <strong>succesvolle</strong> berichten per zoekwoord (duplicates tellen niet mee)
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg border border-gray-200">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Afzender Informatie</h2>
              <p className="text-sm text-gray-600">
                Voeg meerdere namen, emails en telefoonnummers toe. Bij elk bericht wordt willekeurig één combinatie gekozen.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Names */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Namen ({settings.senderNames.length})
              </label>
              <div className="space-y-2">
                {settings.senderNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...settings.senderNames];
                        newNames[index] = e.target.value;
                        setSettings({ ...settings, senderNames: newNames });
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                      placeholder="Bijv. Clara Fischer"
                    />
                    <button
                      onClick={() => {
                        const newNames = settings.senderNames.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderNames: newNames });
                      }}
                      className="rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSettings({ 
                    ...settings, 
                    senderNames: [...settings.senderNames, ''] 
                  })}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  + Naam toevoegen
                </button>
              </div>
            </div>

            {/* Emails */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email adressen ({settings.senderEmails.length})
              </label>
              <div className="space-y-2">
                {settings.senderEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...settings.senderEmails];
                        newEmails[index] = e.target.value;
                        setSettings({ ...settings, senderEmails: newEmails });
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                      placeholder="Bijv. clara@marktplatzranking.de"
                    />
                    <button
                      onClick={() => {
                        const newEmails = settings.senderEmails.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderEmails: newEmails });
                      }}
                      className="rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSettings({ 
                    ...settings, 
                    senderEmails: [...settings.senderEmails, ''] 
                  })}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  + Email toevoegen
                </button>
              </div>
            </div>

            {/* Phone Numbers */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Telefoonnummers ({settings.senderPhones.length}) - Optioneel
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Indien leeg, wordt automatisch een random 06-nummer gegenereerd (06XXXXXXXX)
              </p>
              <div className="space-y-2">
                {settings.senderPhones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const newPhones = [...settings.senderPhones];
                        newPhones[index] = e.target.value;
                        setSettings({ ...settings, senderPhones: newPhones });
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                      placeholder="Bijv. 0612345678"
                    />
                    <button
                      onClick={() => {
                        const newPhones = settings.senderPhones.filter((_, i) => i !== index);
                        setSettings({ ...settings, senderPhones: newPhones });
                      }}
                      className="rounded-lg bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setSettings({ 
                    ...settings, 
                    senderPhones: [...settings.senderPhones, ''] 
                  })}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                >
                  + Telefoonnummer toevoegen
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Onderwerp (standaard)</label>
              <input
                type="text"
                value={settings.subject}
                onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                placeholder="Bijv. Vraag over product"
              />
              <p className="mt-1 text-xs text-gray-500">
                Dit onderwerp kan per campagne worden overschreven op de Dashboard pagina
              </p>
            </div>
          </div>
        </div>

        {/* Message Variables Help Section */}
        <div className="mb-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            📝 Bericht Variabelen
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Gebruik deze variabelen in je berichten. Ze worden automatisch vervangen per bericht.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Seller Variables */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">🎯 Verkoper Informatie</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <code className="rounded bg-blue-100 px-2 py-1 text-xs font-mono text-blue-700">
                    {'{{sellerName}}'}
                  </code>
                  <span className="text-xs text-gray-600">Naam van de verkoper</span>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  Voorbeeld: Beste {'{{sellerName}}'} wordt Beste ElectroShop NL
                </div>
              </div>
            </div>

            {/* Product Variables */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">📦 Product Informatie</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <code className="rounded bg-green-100 px-2 py-1 text-xs font-mono text-green-700">
                    {'{{productTitle}}'}
                  </code>
                  <span className="text-xs text-gray-600">Titel van het product</span>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  Voorbeeld: Interesse in {'{{productTitle}}'} wordt Interesse in Samsung Galaxy USB-C Kabel
                </div>
              </div>
            </div>

            {/* Keyword Variable */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">🔍 Zoekwoord</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <code className="rounded bg-purple-100 px-2 py-1 text-xs font-mono text-purple-700">
                    {'{{keyword}}'}
                  </code>
                  <span className="text-xs text-gray-600">Gebruikte zoekwoord</span>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  Voorbeeld: Zoek naar {'{{keyword}}'} wordt Zoek naar powerbank
                </div>
              </div>
            </div>

            {/* Sender Variables */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">👤 Jouw Gegevens (Random)</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-start gap-2">
                    <code className="rounded bg-orange-100 px-2 py-1 text-xs font-mono text-orange-700">
                      {'{{senderName}}'}
                    </code>
                    <span className="text-xs text-gray-600">Jouw naam (willekeurig)</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-2 mt-1">
                    Pakt random uit: Clara Fischer, Kaja Blum, Simon de Vries, etc.
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-2">
                    <code className="rounded bg-orange-100 px-2 py-1 text-xs font-mono text-orange-700">
                      {'{{senderEmail}}'}
                    </code>
                    <span className="text-xs text-gray-600">Jouw email (willekeurig)</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-2 mt-1">
                    Pakt random uit je email lijst hierboven
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-2">
                    <code className="rounded bg-orange-100 px-2 py-1 text-xs font-mono text-orange-700">
                      {'{{senderPhone}}'}
                    </code>
                    <span className="text-xs text-gray-600">Jouw telefoon (willekeurig)</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-2 mt-1">
                    Pakt random uit je telefoon lijst of genereert 06XXXXXXXX
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example Message */}
          <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">💡 Voorbeeld Bericht</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Template:</div>
                <div className="rounded bg-gray-50 p-3 font-mono text-xs text-gray-700">
                  Beste {'{{sellerName}}'},<br/><br/>
                  Ik ben geïnteresseerd in uw product "{'{{productTitle}}'}". <br/>
                  Kunt u mij meer informatie sturen?<br/><br/>
                  Met vriendelijke groet,<br/>
                  {'{{senderName}}'}<br/>
                  {'{{senderEmail}}'}<br/>
                  {'{{senderPhone}}'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Wordt automatisch:</div>
                <div className="rounded bg-green-50 p-3 text-xs text-gray-700">
                  Beste ElectroShop NL,<br/><br/>
                  Ik ben geïnteresseerd in uw product "Samsung 20000mAh Powerbank". <br/>
                  Kunt u mij meer informatie sturen?<br/><br/>
                  Met vriendelijke groet,<br/>
                  Clara Fischer<br/>
                  clara@marktplatzranking.de<br/>
                  0698234567
                </div>
              </div>
            </div>
          </div>

          {/* Quick Copy Section */}
          <div className="mt-4 rounded-lg border-2 border-dashed border-blue-300 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">⚡ Snel Kopiëren</h3>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    navigator.clipboard.writeText(p.key);
                    // Show toast notification
                    const toast = document.createElement('div');
                    toast.textContent = `${p.key} gekopieerd!`;
                    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                  }}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-2 font-mono text-xs text-white hover:from-blue-600 hover:to-indigo-600 shadow-sm transition-all"
                  title={p.description}
                >
                  {p.key}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              💡 Klik om te kopiëren, plak in je berichten hieronder
            </p>
          </div>
        </div>

        {/* Message Templates */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-lg border border-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Bericht Templates</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Selecteer welke templates gebruikt worden. Het systeem kiest willekeurig uit
                  geselecteerde templates. 
                  <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {enabledCount} van {settings.messageTemplates.length} actief
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllTemplates}
                className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
              >
                ✓ Alles
              </button>
              <button
                onClick={deselectAllTemplates}
                className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                ✕ Geen
              </button>
            </div>
          </div>

          {/* Template List */}
          <div className="space-y-3">
            {settings.messageTemplates.map((template) => (
              <div
                key={template.id}
                className={`rounded-lg border-2 p-4 transition ${
                  template.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {editingTemplate === template.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Template naam"
                      className="w-full rounded border px-3 py-2 font-medium"
                    />

                    {/* Placeholders */}
                    <div className="rounded bg-white p-3">
                      <div className="mb-2 text-xs font-medium text-gray-600">
                        Klik om placeholder in te voegen:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PLACEHOLDERS.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => insertPlaceholder(p.key)}
                            className="rounded bg-blue-100 px-2 py-1 text-xs font-mono text-blue-700 hover:bg-blue-200"
                          >
                            {p.key}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Bericht inhoud..."
                      rows={8}
                      className="w-full rounded border px-3 py-2 font-mono text-sm"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={saveEditTemplate}
                        className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                      >
                        Opslaan
                      </button>
                      <button
                        onClick={cancelEditTemplate}
                        className="rounded bg-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-400"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={template.enabled}
                      onChange={() => toggleTemplate(template.id)}
                      className="mt-1 h-5 w-5 rounded"
                    />
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              startEditTemplate(template.id, template.name, template.content)
                            }
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => removeTemplate(template.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap rounded bg-white p-3 text-sm text-gray-700">
                        {template.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addTemplate}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            + Nieuw Template Toevoegen
          </button>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-1 shadow-2xl">
          <button
            onClick={saveSettings}
            className="w-full rounded-lg bg-white px-6 py-4 font-bold text-green-600 transition hover:bg-green-50 flex items-center justify-center gap-3"
          >
            {saved ? (
              <>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>✓ Instellingen Opgeslagen!</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>💾 Instellingen Opslaan</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
