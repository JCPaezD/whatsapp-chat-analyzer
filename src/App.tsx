import { useEffect, useMemo, useState } from "react";
import { ConversationExplorer } from "./components/ConversationExplorer";
import { StatsDashboard } from "./components/StatsDashboard";
import { UploadPanel } from "./components/UploadPanel";
import { computeRecommendation } from "./recommendation/computeRecommendation";
import { computeStats } from "./stats/computeStats";
import { Message } from "./types/message.types";

type ActiveView = "upload" | "stats" | "explorer";

function formatSimpleDate(date: Date): string {
  return date.toLocaleDateString("es-ES");
}

export default function App(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [activeView, setActiveView] = useState<ActiveView>("upload");

  const stats = useMemo(() => (messages.length > 0 ? computeStats(messages) : null), [messages]);
  const recommendation = useMemo(
    () => (stats ? computeRecommendation(messages, stats.bursts) : null),
    [messages, stats]
  );
  const authors = useMemo(() => (stats ? stats.messagesByAuthor.map((item) => item.author) : []), [stats]);
  const hasLoadedFile = messages.length > 0;

  useEffect(() => {
    if (!hasLoadedFile && activeView !== "upload") {
      setActiveView("upload");
    }
  }, [activeView, hasLoadedFile]);

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 md:px-6 md:py-5">
        <header className="sticky top-2 z-30 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Analizador de Chats de WhatsApp
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Aplicacion analitica client-side para procesar exportaciones .txt de WhatsApp.
              </p>
            </div>
            {fileName && (
              <p className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 sm:text-sm">
                Archivo activo: <span className="ml-1 text-slate-900">{fileName}</span>
              </p>
            )}
          </div>

          <nav className="mt-3 border-t border-slate-200 pt-3" aria-label="Navegacion principal">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveView("upload")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeView === "upload"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Carga
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasLoadedFile) {
                    setActiveView("stats");
                  }
                }}
                disabled={!hasLoadedFile}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeView === "stats" && hasLoadedFile
                    ? "bg-teal-700 text-white shadow-sm"
                    : hasLoadedFile
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                Analisis
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasLoadedFile) {
                    setActiveView("explorer");
                  }
                }}
                disabled={!hasLoadedFile}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeView === "explorer" && hasLoadedFile
                    ? "bg-teal-700 text-white shadow-sm"
                    : hasLoadedFile
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                Explorador
              </button>
            </div>
          </nav>
        </header>

        {activeView === "upload" && (
          <UploadPanel
            onMessagesLoaded={(loadedMessages, selectedFileName) => {
              setMessages(loadedMessages);
              setFileName(selectedFileName);
            }}
            hasLoadedFile={hasLoadedFile}
            fileName={fileName}
            totalMessages={stats?.totalMessages ?? 0}
            uniqueAuthors={stats?.uniqueAuthors ?? 0}
            dateRangeLabel={
              stats?.dateRange
                ? `${formatSimpleDate(stats.dateRange.start)} - ${formatSimpleDate(stats.dateRange.end)}`
                : ""
            }
            onGoToStats={() => setActiveView("stats")}
            onGoToExplorer={() => setActiveView("explorer")}
          />
        )}

        {activeView === "stats" && hasLoadedFile && (
          <StatsDashboard stats={stats} recommendation={recommendation} />
        )}

        {activeView === "explorer" && hasLoadedFile && (
          <ConversationExplorer messages={messages} authors={authors} />
        )}
      </div>
    </main>
  );
}
