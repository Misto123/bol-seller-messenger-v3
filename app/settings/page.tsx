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
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  sponsoredOnly: boolean;
}

const DEFAULT_SETTINGS: CampaignSettings = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje'],
  cooldownMinutes: 5,
  messagesPerKeyword: 3,
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
  senderName: 'Jan de Vries',
  senderEmail: 'jan@vries.nl',
  senderPhone: '0612345678',
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-gray-900">Campagne Instellingen</h1>
          <p className="mt-2 text-gray-600">Configureer uw BOL.nl verkoper outreach campagnes</p>
        </div>

        {/* Keywords Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Zoekwoorden</h2>
          <p className="mb-4 text-sm text-gray-600">
            Voeg zoekwoorden toe waarmee u verkopers wilt vinden op BOL.nl
          </p>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="bijv. powerbank, usb kabel..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Campagne Instellingen</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={settings.sponsoredOnly}
                  onChange={(e) =>
                    setSettings({ ...settings, sponsoredOnly: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Alleen gesponsorde producten contacteren</span>
              </label>
              <p className="ml-6 text-xs text-gray-500">
                Wanneer aangevinkt, worden alleen verkopers van gesponsorde (betaalde) advertenties
                gecontacteerd. Deze verkopers hebben budget voor marketing en zijn vaak meer open
                voor partnerships.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cooldown tussen zoekwoorden (minuten)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.cooldownMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, cooldownMinutes: parseInt(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Wachttijd tussen het verwerken van verschillende zoekwoorden
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Aantal berichten per zoekwoord
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.messagesPerKeyword}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    messagesPerKeyword: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximaal aantal verkopers om te contacteren per zoekwoord
              </p>
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Afzender Informatie</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Naam</label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Telefoonnummer</label>
              <input
                type="tel"
                value={settings.senderPhone}
                onChange={(e) => setSettings({ ...settings, senderPhone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Onderwerp</label>
              <input
                type="text"
                value={settings.subject}
                onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bericht Templates</h2>
              <p className="mt-1 text-sm text-gray-600">
                Selecteer welke templates gebruikt worden. Het systeem kiest willekeurig uit
                geselecteerde templates. ({enabledCount} van {settings.messageTemplates.length}{' '}
                actief)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllTemplates}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Alles selecteren
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={deselectAllTemplates}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Alles deselecteren
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
        <div className="rounded-lg bg-white p-6 shadow">
          <button
            onClick={saveSettings}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            {saved ? '✓ Instellingen Opgeslagen' : 'Instellingen Opslaan'}
          </button>

          {saved && (
            <p className="mt-2 text-center text-sm text-green-600">
              Uw instellingen zijn succesvol opgeslagen!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
