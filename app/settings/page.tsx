'use client';

import { useState, useEffect } from 'react';

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

const DEFAULT_SETTINGS: CampaignSettings = {
  keywords: ['powerbank', 'usb kabel', 'telefoonhoesje'],
  cooldownMinutes: 5,
  messagesPerKeyword: 3,
  messageTemplates: [
    'Beste {{sellerName}},\n\nIk ben geïnteresseerd in uw product "{{productTitle}}" en zou graag meer informatie willen ontvangen.\n\nMet vriendelijke groet,\n{{senderName}}',
    'Hallo {{sellerName}},\n\nIk zoek een betrouwbare leverancier voor {{productTitle}}. Kunt u mij informatie sturen over bulkprijzen?\n\nGroeten,\n{{senderName}}',
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
  const [newTemplate, setNewTemplate] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('campaignSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
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
      keywords: settings.keywords.filter(k => k !== keyword),
    });
  };

  const addTemplate = () => {
    if (newTemplate.trim()) {
      setSettings({
        ...settings,
        messageTemplates: [...settings.messageTemplates, newTemplate.trim()],
      });
      setNewTemplate('');
    }
  };

  const removeTemplate = (index: number) => {
    setSettings({
      ...settings,
      messageTemplates: settings.messageTemplates.filter((_, i) => i !== index),
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    setNewTemplate(newTemplate + placeholder);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campagne Instellingen</h1>
          <p className="text-gray-600">Configureer uw BOL.nl verkoper outreach campagnes</p>
        </div>

        {/* Keywords Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Zoekwoorden</h2>
          <p className="text-sm text-gray-600 mb-4">
            Voeg zoekwoorden toe waarmee u verkopers wilt vinden op BOL.nl
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              placeholder="bijv. powerbank, usb kabel..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addKeyword}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Toevoegen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.keywords.map((keyword) => (
              <div
                key={keyword}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Campagne Instellingen</h2>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
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
              <p className="text-xs text-gray-500 ml-6">
                Wanneer aangevinkt, worden alleen verkopers van gesponsorde (betaalde) advertenties gecontacteerd.
                Deze verkopers hebben budget voor marketing en zijn vaak meer open voor partnerships.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wachttijd tussen het verwerken van verschillende zoekwoorden
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aantal berichten per zoekwoord
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.messagesPerKeyword}
                onChange={(e) =>
                  setSettings({ ...settings, messagesPerKeyword: parseInt(e.target.value) || 1 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximaal aantal verkopers om te contacteren per zoekwoord
              </p>
            </div>
          </div>
        </div>

        {/* Sender Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Afzender Informatie</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Naam</label>
              <input
                type="text"
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefoonnummer</label>
              <input
                type="tel"
                value={settings.senderPhone}
                onChange={(e) => setSettings({ ...settings, senderPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Onderwerp</label>
              <input
                type="text"
                value={settings.subject}
                onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bericht Templates</h2>
          <p className="text-sm text-gray-600 mb-4">
            Maak meerdere templates aan. Het systeem kiest willekeurig een template per bericht.
          </p>

          {/* Placeholders */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Beschikbare placeholders:</h3>
            <div className="grid grid-cols-2 gap-2">
              {PLACEHOLDERS.map((p) => (
                <div key={p.key} className="flex items-start gap-2">
                  <button
                    onClick={() => insertPlaceholder(p.key)}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-mono"
                  >
                    {p.key}
                  </button>
                  <span className="text-xs text-gray-600">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Template */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nieuw Template</label>
            <textarea
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Schrijf uw bericht hier... Gebruik placeholders zoals {{sellerName}}"
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              onClick={addTemplate}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Template Toevoegen
            </button>
          </div>

          {/* Existing Templates */}
          <div className="space-y-4">
            {settings.messageTemplates.map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Template {index + 1}</h4>
                  <button
                    onClick={() => removeTemplate(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Verwijder
                  </button>
                </div>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
                  {template}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={saveSettings}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            {saved ? '✓ Instellingen Opgeslagen' : 'Instellingen Opslaan'}
          </button>

          {saved && (
            <p className="text-center text-green-600 mt-2 text-sm">
              Uw instellingen zijn succesvol opgeslagen!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
