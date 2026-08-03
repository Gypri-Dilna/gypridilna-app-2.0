import React, { useState } from 'react';
import { Globe, ArrowRight, RotateCw } from 'lucide-react';

export const WebConnect: React.FC = () => {
  const [url, setUrl] = useState('https://github.com');
  const [activeUrl, setActiveUrl] = useState('https://github.com');

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      setActiveUrl(url.trim());
    }
  };

  return (
    <div className="p-8 space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-black text-brand-paper tracking-wider">
          WEBCONNECT MODULE
        </h2>
        <p className="text-xs text-brand-paperMuted mt-1">
          Embedded web container replacing legacy FlutterConnect
        </p>
      </div>

      {/* URL Navigation Bar */}
      <form onSubmit={handleNavigate} className="bg-brand-surface border border-brand-border p-3 rounded-2xl flex items-center space-x-3 shadow-md">
        <Globe className="w-5 h-5 text-brand-mint shrink-0 ml-2" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-xs text-brand-paper focus:outline-none focus:border-brand-mint font-mono"
        />
        <button
          type="submit"
          className="bg-brand-mint text-brand-dark font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-mintLight transition-colors flex items-center space-x-1"
        >
          <span>Go</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveUrl(activeUrl + '?reload=' + Date.now())}
          className="p-2 text-brand-paperMuted hover:text-brand-paper transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </form>

      {/* Embedded Iframe Container */}
      <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
        <iframe
          src={activeUrl}
          title="WebConnect Frame"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
};
