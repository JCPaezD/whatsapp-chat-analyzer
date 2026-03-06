import { ChangeEvent, useState } from "react";
import { parseWhatsApp } from "../parser/parseWhatsApp";
import { Message } from "../types/message.types";

interface UploadPanelProps {
  onMessagesLoaded: (messages: Message[], fileName: string) => void;
  hasLoadedFile: boolean;
  fileName: string;
  totalMessages: number;
  uniqueAuthors: number;
  dateRangeLabel: string;
  onGoToStats: () => void;
  onGoToExplorer: () => void;
}

export function UploadPanel({
  onMessagesLoaded,
  hasLoadedFile,
  fileName,
  totalMessages,
  uniqueAuthors,
  dateRangeLabel,
  onGoToStats,
  onGoToExplorer
}: UploadPanelProps): JSX.Element {
  const [error, setError] = useState<string>("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");

    try {
      const text = await file.text();
      const messages = parseWhatsApp(text);

      if (messages.length === 0) {
        setError("No se pudieron extraer mensajes con el formato esperado.");
        onMessagesLoaded([], file.name);
        return;
      }

      onMessagesLoaded(messages, file.name);
    } catch {
      setError("Error al leer el archivo.");
      onMessagesLoaded([], file.name);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Panel de carga</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Carga un archivo .txt exportado de WhatsApp con formato: [D/M/YY, H:MM:SS] Autor: Mensaje
          </p>
        </div>
        <span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
          Entrada local
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 sm:p-4">
        <input
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileChange}
          className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-600"
        />
      </div>

      {hasLoadedFile && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 ring-1 ring-slate-100">
          <p className="text-sm text-slate-600">
            Archivo: <span className="font-medium text-slate-900 break-all">{fileName}</span>
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mensajes</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{totalMessages.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Autores</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{uniqueAuthors}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Rango</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{dateRangeLabel}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onGoToStats}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Ir a Analisis
            </button>
            <button
              type="button"
              onClick={onGoToExplorer}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
            >
              Ir al Explorador
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
    </section>
  );
}
