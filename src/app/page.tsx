"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw, Plus, Trash2, Mail, Check, ChevronDown } from "lucide-react";

// List of available domains
const DOMAINS = [
  "myssgood.tech",
  "mailgonow.tech",
  "prock.app",
  "lukas.indevs.in",
  "mantap.indevs.in",
  "maung.indevs.in",
  "googg.indevs.in",
  "goodjob.indevs.in",
  "mailkita.indevs.in",
  "galdoto.my.id",
  "gocaria.my.id",
  "guildboi.my.id",
  "pekaus.pw",
  "pikas.pw",
  "pikasu.pw",
  "pykasu.pw",
  "pyraas.pw",
  "ghostmail.pw",
  "boltmail.pw",
  "flashmail.pw",
  "cryptmail.pw",
  "cloakmail.pw",
  "secretmail.pw",
  "goodalmail.shop",
];

// Generate random username
function generateUsername(): string {
  const adjectives = ["quick", "lazy", "happy", "sad", "bright", "dark", "cool", "warm", "fast", "slow"];
  const nouns = ["fox", "dog", "cat", "bird", "fish", "bear", "wolf", "lion", "tiger", "eagle"];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomAdj}${randomNoun}${randomNum}`;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
}

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>(DOMAINS[9]); // galdoto.my.id default
  const [emails, setEmails] = useState<Email[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Initialize username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("tempmail_username");
    const savedDomain = localStorage.getItem("tempmail_domain");

    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      const newUsername = generateUsername();
      setUsername(newUsername);
      localStorage.setItem("tempmail_username", newUsername);
    }

    if (savedDomain && DOMAINS.includes(savedDomain)) {
      setSelectedDomain(savedDomain);
    }
  }, []);

  // Save domain preference
  useEffect(() => {
    if (selectedDomain) {
      localStorage.setItem("tempmail_domain", selectedDomain);
    }
  }, [selectedDomain]);

  const fullEmail = `${username}@${selectedDomain}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullEmail;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullEmail]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate checking for new emails
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const handleNew = useCallback(() => {
    const newUsername = generateUsername();
    setUsername(newUsername);
    localStorage.setItem("tempmail_username", newUsername);
    setEmails([]);
    setSelectedEmail(null);
  }, []);

  const handleDelete = useCallback(() => {
    setEmails([]);
    setSelectedEmail(null);
  }, []);

  const handleSelectDomain = useCallback((domain: string) => {
    setSelectedDomain(domain);
    setIsDropdownOpen(false);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header with Logo */}
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3">
          {/* Left decorative bars */}
          <div className="flex gap-1">
            <div className="w-2 h-8 bg-white/80 rounded-full transform -skew-x-12" />
            <div className="w-2 h-8 bg-white/80 rounded-full transform -skew-x-12" />
            <div className="w-2 h-8 bg-white/80 rounded-full transform -skew-x-12" />
          </div>

          {/* Logo text */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white tracking-wider">TOPUPGG</div>
            <div className="text-xs text-white/70 tracking-widest">TEMP MAIL</div>
          </div>

          {/* Right decorative bars */}
          <div className="flex gap-1">
            <div className="w-2 h-8 bg-white/80 rounded-full transform skew-x-12" />
            <div className="w-2 h-8 bg-white/80 rounded-full transform skew-x-12" />
            <div className="w-2 h-8 bg-white/80 rounded-full transform skew-x-12" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pb-8">
        {/* Email control panel */}
        <div className="bg-purple-500/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 border border-purple-400/20">
          {/* Email input and domain selector */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {/* Username input */}
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                localStorage.setItem("tempmail_username", e.target.value);
              }}
              className="flex-1 bg-purple-400/20 border-2 border-purple-300/30 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-300/50 placeholder-white/50"
              placeholder="username"
            />

            {/* Domain selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-56 bg-purple-400/20 border-2 border-purple-300/30 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-300/50 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  @{selectedDomain}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-purple-900 border border-purple-400/30 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => handleSelectDomain(domain)}
                      className={`w-full px-4 py-2 text-left text-white hover:bg-purple-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedDomain === domain ? "bg-purple-700" : ""
                      }`}
                    >
                      {selectedDomain === domain && <span className="text-green-400 mr-2">✓</span>}
                      @{domain}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95"
            >
              {copied ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
              <span className="text-xs sm:text-sm text-white font-medium">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-xs sm:text-sm text-white font-medium">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleNew}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">New</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95"
            >
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <span className="text-xs sm:text-sm text-white font-medium">Delete</span>
            </button>
          </div>
        </div>

        {/* Inbox section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white/70 mb-4">
            {emails.length > 0 ? `Inbox (${emails.length})` : "Empty Inbox"}
          </h2>

          {emails.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No emails yet</p>
              <p className="text-sm mt-2">Emails will appear here when received</p>
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full text-left p-4 rounded-xl transition-colors ${
                    email.read ? "bg-purple-500/20" : "bg-purple-500/40"
                  } hover:bg-purple-500/50`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{email.from}</span>
                    <span className="text-white/50 text-sm">
                      {email.date.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mt-1 truncate">{email.subject}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email detail modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-purple-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedEmail.subject}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-white/70 text-sm mb-4">From: {selectedEmail.from}</p>
              <div className="text-white/90 whitespace-pre-wrap">{selectedEmail.body}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-white/40 text-sm">
        <p>TOPUPGG Temp Mail - Secure & Disposable Email Service</p>
      </footer>
    </main>
  );
}
