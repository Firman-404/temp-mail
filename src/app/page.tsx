"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, RefreshCw, Plus, Trash2, Mail, Check, ChevronDown, X, Clock } from "lucide-react";

// List of available domains (for display, actual domain comes from API)
const DISPLAY_DOMAINS = [
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
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface Email {
  id: string;
  from: {
    address: string;
    name: string;
  };
  subject: string;
  intro: string;
  text?: string;
  html?: string[];
  createdAt: string;
  read: boolean;
}

interface ApiDomain {
  id: string;
  domain: string;
}

interface Account {
  id: string;
  address: string;
  token: string;
}

// Mail.tm API base URL
const API_BASE = "https://api.mail.tm";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>(DISPLAY_DOMAINS[9]);
  const [apiDomains, setApiDomains] = useState<ApiDomain[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [emailContent, setEmailContent] = useState<string>("");
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available domains from API
  const fetchDomains = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/domains`);
      if (response.ok) {
        const data = await response.json();
        if (data["hydra:member"] && data["hydra:member"].length > 0) {
          setApiDomains(data["hydra:member"]);
        }
      }
    } catch (error) {
      console.log("Using display domains as fallback");
    }
  }, []);

  // Create a new account
  const createAccount = useCallback(async (user: string, domain: string) => {
    setIsLoading(true);
    try {
      const email = `${user}@${domain}`;
      const password = `Pass${Math.random().toString(36).slice(2)}!`;

      // Create account
      const createResponse = await fetch(`${API_BASE}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: email, password }),
      });

      if (createResponse.ok) {
        // Get token
        const tokenResponse = await fetch(`${API_BASE}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password }),
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const newAccount: Account = {
            id: tokenData.id,
            address: email,
            token: tokenData.token,
          };
          setAccount(newAccount);
          localStorage.setItem("tempmail_account", JSON.stringify(newAccount));
          setEmails([]);
          return true;
        }
      }
    } catch (error) {
      console.error("Error creating account:", error);
    }
    setIsLoading(false);
    return false;
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!account?.token) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data["hydra:member"]) {
          setEmails(data["hydra:member"]);
        }
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
    setIsRefreshing(false);
  }, [account?.token]);

  // Fetch single email content
  const fetchEmailContent = useCallback(async (emailId: string) => {
    if (!account?.token) return;

    try {
      const response = await fetch(`${API_BASE}/messages/${emailId}`, {
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailContent(data.text || data.html?.join("") || "No content available");
      }
    } catch (error) {
      console.error("Error fetching email content:", error);
    }
  }, [account?.token]);

  // Initialize
  useEffect(() => {
    fetchDomains();

    // Try to restore saved account
    const savedAccount = localStorage.getItem("tempmail_account");
    if (savedAccount) {
      try {
        const parsed = JSON.parse(savedAccount);
        setAccount(parsed);
        const [user, domain] = parsed.address.split("@");
        setUsername(user);
        if (domain) setSelectedDomain(domain);
      } catch {
        const newUsername = generateUsername();
        setUsername(newUsername);
      }
    } else {
      const newUsername = generateUsername();
      setUsername(newUsername);
    }
  }, [fetchDomains]);

  // Fetch emails when account is set
  useEffect(() => {
    if (account?.token) {
      fetchEmails();
    }
  }, [account?.token, fetchEmails]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (autoRefresh && account?.token) {
      autoRefreshRef.current = setInterval(() => {
        fetchEmails();
      }, 10000);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, account?.token, fetchEmails]);

  // Get the active domain (from API or display list)
  const activeDomain = apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain;
  const fullEmail = account?.address || `${username}@${activeDomain}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    fetchEmails();
  }, [fetchEmails]);

  const handleNew = useCallback(async () => {
    const newUsername = generateUsername();
    setUsername(newUsername);
    setEmails([]);
    setSelectedEmail(null);
    setAccount(null);
    localStorage.removeItem("tempmail_account");

    // Create new account with API domain if available
    const domain = apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain;
    await createAccount(newUsername, domain);
  }, [apiDomains, selectedDomain, createAccount]);

  const handleDelete = useCallback(() => {
    setEmails([]);
    setSelectedEmail(null);
  }, []);

  const handleSelectDomain = useCallback((domain: string) => {
    setSelectedDomain(domain);
    setIsDropdownOpen(false);
  }, []);

  const handleEmailClick = useCallback(async (email: Email) => {
    setSelectedEmail(email);
    setEmailContent("");
    await fetchEmailContent(email.id);
  }, [fetchEmailContent]);

  const handleActivate = useCallback(async () => {
    const domain = apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain;
    await createAccount(username, domain);
  }, [username, apiDomains, selectedDomain, createAccount]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!account}
              className="flex-1 bg-purple-400/20 border-2 border-purple-300/30 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-purple-300/50 placeholder-white/50 disabled:opacity-70"
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
                  @{apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-purple-900 border border-purple-400/30 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {(apiDomains.length > 0 ? apiDomains.map(d => d.domain) : DISPLAY_DOMAINS).map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => handleSelectDomain(domain)}
                      className={`w-full px-4 py-2 text-left text-white hover:bg-purple-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        (apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain) === domain ? "bg-purple-700" : ""
                      }`}
                    >
                      {(apiDomains.length > 0 ? apiDomains[0].domain : selectedDomain) === domain && <span className="text-green-400 mr-2">✓</span>}
                      @{domain}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activate button (if no account) */}
          {!account && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={isLoading}
              className="w-full mb-4 bg-green-500/80 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:opacity-60"
            >
              {isLoading ? "Creating mailbox..." : "Activate Email Address"}
            </button>
          )}

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
              disabled={isRefreshing || !account}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-xs sm:text-sm text-white font-medium">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleNew}
              disabled={isLoading}
              className="flex flex-col items-center gap-1 sm:gap-2 bg-purple-500/40 hover:bg-purple-500/60 rounded-xl py-3 sm:py-4 transition-all duration-200 active:scale-95 disabled:opacity-60"
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

          {/* Auto-refresh toggle */}
          {account && (
            <div className="mt-4 flex items-center justify-between text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Auto-refresh: {autoRefresh ? "ON (10s)" : "OFF"}</span>
                {lastRefresh && (
                  <span className="text-white/50">
                    | Last: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  autoRefresh ? "bg-green-500/50 hover:bg-green-500/70" : "bg-purple-500/40 hover:bg-purple-500/60"
                }`}
              >
                {autoRefresh ? "Disable" : "Enable"}
              </button>
            </div>
          )}
        </div>

        {/* Inbox section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white/70 mb-4">
            {emails.length > 0 ? `Inbox (${emails.length})` : "Empty Inbox"}
          </h2>

          {!account ? (
            <div className="text-center py-12 text-white/50">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Click "Activate Email Address" to start</p>
              <p className="text-sm mt-2">Your temporary inbox will be created instantly</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No emails yet</p>
              <p className="text-sm mt-2">Emails will appear here when received</p>
              {autoRefresh && (
                <p className="text-xs mt-4 text-green-400/70">
                  Auto-refreshing every 10 seconds...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => handleEmailClick(email)}
                  className="w-full text-left p-4 rounded-xl transition-colors bg-purple-500/30 hover:bg-purple-500/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate max-w-[60%]">
                      {email.from?.name || email.from?.address || "Unknown sender"}
                    </span>
                    <span className="text-white/50 text-sm">
                      {formatDate(email.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/90 font-medium mt-1 truncate">{email.subject || "(No subject)"}</p>
                  <p className="text-white/60 text-sm mt-1 truncate">{email.intro || ""}</p>
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
                <h3 className="text-xl font-bold text-white truncate pr-4">
                  {selectedEmail.subject || "(No subject)"}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="text-white/70 hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="text-white/70 text-sm mb-4 space-y-1">
                <p><strong>From:</strong> {selectedEmail.from?.name || ""} &lt;{selectedEmail.from?.address || "Unknown"}&gt;</p>
                <p><strong>Date:</strong> {formatDate(selectedEmail.createdAt)}</p>
              </div>
              <div className="border-t border-purple-700 pt-4">
                {emailContent ? (
                  <div
                    className="text-white/90 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: emailContent }}
                  />
                ) : (
                  <div className="text-center text-white/50 py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading email content...
                  </div>
                )}
              </div>
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
