import React, { useState } from 'react';
import { WebConnectIcon, ExternalLinkIcon, RefreshIcon, Globe as GlobeIcon } from './icons';

interface WebConnectProps {
    defaultUrl?: string;
}

const PRESET_TOOLS = [
    { name: "3D Printer Web UI (Mainsail/OctoPrint)", url: "http://192.168.1.100", icon: "🖨️" },
    { name: "CNC Router Web Controller", url: "http://192.168.1.101", icon: "⚙️" },
    { name: "Gypri Dílna Documentation & Wiki", url: "https://www.gypridilna.cz", icon: "🌐" },
    { name: "ESP32 Hardware Monitor", url: "http://192.168.1.200", icon: "⚡" }
];

export const WebConnect: React.FC<WebConnectProps> = ({ defaultUrl = "https://www.gypridilna.cz" }) => {
    const [targetUrl, setTargetUrl] = useState<string>(defaultUrl);
    const [inputUrl, setInputUrl] = useState<string>(defaultUrl);
    const [iframeKey, setIframeKey] = useState<number>(0);

    const handleNavigate = (e: React.FormEvent) => {
        e.preventDefault();
        let formatted = inputUrl.trim();
        if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
            formatted = `https://${formatted}`;
        }
        setTargetUrl(formatted);
        setIframeKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            {/* Header & Quick Launch Bar */}
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 text-brand-cyan rounded-xl">
                            <WebConnectIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Embedded Workshop WebConnect Module</h1>
                            <p className="text-xs text-gray-400">Integrated Web Interface for Secondary Workshop Tools & OctoPrint / CNC Nodes</p>
                        </div>
                    </div>

                    <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold rounded-xl border border-brand-border transition"
                    >
                        <ExternalLinkIcon className="h-4 w-4" />
                        Open in New Tab
                    </a>
                </div>

                {/* Preset Shortcuts */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border">
                    {PRESET_TOOLS.map((preset, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setTargetUrl(preset.url);
                                setInputUrl(preset.url);
                                setIframeKey(prev => prev + 1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                                targetUrl === preset.url
                                    ? 'bg-brand-cyan text-black border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                                    : 'bg-slate-900 border-brand-border text-gray-300 hover:border-gray-600'
                            }`}
                        >
                            <span>{preset.icon}</span>
                            <span>{preset.name}</span>
                        </button>
                    ))}
                </div>

                {/* URL Input Bar */}
                <form onSubmit={handleNavigate} className="flex gap-2">
                    <div className="relative flex-1">
                        <GlobeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Enter external web tool URL..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-brand-border rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-cyan"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-brand-border transition"
                    >
                        Load Target
                    </button>
                    <button
                        type="button"
                        onClick={() => setIframeKey(prev => prev + 1)}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-gray-300 rounded-xl border border-brand-border transition"
                        title="Reload frame"
                    >
                        <RefreshIcon className="h-4 w-4" />
                    </button>
                </form>
            </div>

            {/* Embedded iFrame Container */}
            <div className="bg-slate-950 border-2 border-brand-border rounded-2xl overflow-hidden shadow-2xl h-[650px] relative">
                <iframe
                    key={iframeKey}
                    src={targetUrl}
                    title="Workshop Embedded Tool"
                    className="w-full h-full border-none"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
        </div>
    );
};
