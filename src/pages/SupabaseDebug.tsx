import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function SupabaseDebug() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<{
    supabaseUrl: string;
    supabaseKeyPresent: boolean;
    connectionTest: "pending" | "success" | "error";
    errorMessage?: string;
    session: any;
  }>({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "NOT SET",
    supabaseKeyPresent: !!(import.meta.env.VITE_SUPABASE_ANON_KEY),
    connectionTest: "pending",
    session: null,
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus(prev => ({
          ...prev,
          connectionTest: "error",
          errorMessage: error.message,
          session: null,
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          connectionTest: "success",
          session: data.session,
        }));
      }
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        connectionTest: "error",
        errorMessage: error.message || "Connection failed",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-cyan-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Button>

        <div className="border border-cyan-500 rounded-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-cyan-400">Supabase Connection Status</h1>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
              {status.supabaseUrl !== "NOT SET" ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-400">Supabase URL</p>
                <p className="font-mono text-xs">{status.supabaseUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
              {status.supabaseKeyPresent ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-400">Supabase Anon Key</p>
                <p className="font-mono text-xs">
                  {status.supabaseKeyPresent ? "Present" : "NOT SET"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
              {status.connectionTest === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : status.connectionTest === "error" ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <div className="w-5 h-5 animate-pulse bg-yellow-400 rounded-full" />
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-400">Connection Test</p>
                <p className="font-mono text-xs">
                  {status.connectionTest === "success"
                    ? "Connected successfully"
                    : status.connectionTest === "error"
                    ? `Error: ${status.errorMessage}`
                    : "Testing..."}
                </p>
              </div>
              <Button size="sm" onClick={testConnection}>
                Retry
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
              {status.session ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-400">Current Session</p>
                <p className="font-mono text-xs">
                  {status.session ? `Logged in as ${status.session.user.email}` : "Not logged in"}
                </p>
              </div>
            </div>
          </div>

          {status.connectionTest === "success" && !status.session && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-sm">
              ℹ️ Supabase è connesso correttamente. Devi registrarti su <strong>/auth</strong> per creare un account.
            </div>
          )}

          {status.connectionTest === "error" && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              ❌ Errore di connessione. Verifica le variabili d'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => setLocation("/auth")}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
            >
              Vai a Registrazione
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="flex-1"
            >
              Torna alla Home
            </Button>
          </div>
        </div>

        <div className="border border-gray-700 rounded-lg p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-300">Environment Variables</h2>
          <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(
              {
                VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "NOT SET",
                VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
                  ? "***" + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10)
                  : "NOT SET",
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
