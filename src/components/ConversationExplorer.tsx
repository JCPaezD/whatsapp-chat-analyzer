import { useEffect, useMemo, useState } from "react";
import { ExplorerFilters, Message } from "../types/message.types";
import {
  WEEKDAY_LABELS,
  formatDateTime,
  toLocalDateInputValue,
  toMondayFirstWeekdayIndexFromJsDay
} from "../utils/dateUtils";

interface ConversationExplorerProps {
  messages: Message[];
  authors: string[];
}

function createInitialFilters(messages: Message[]): ExplorerFilters {
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const first = sorted[0]?.timestamp;
  const last = sorted[sorted.length - 1]?.timestamp;

  return {
    selectedAuthors: [],
    dateStart: first ? toLocalDateInputValue(first) : "",
    dateEnd: last ? toLocalDateInputValue(last) : "",
    weekdays: [],
    hourStart: "0",
    hourEnd: "23",
    textQuery: ""
  };
}

export function ConversationExplorer({ messages, authors }: ConversationExplorerProps): JSX.Element {
  const [filters, setFilters] = useState<ExplorerFilters>(() => createInitialFilters(messages));

  useEffect(() => {
    setFilters(createInitialFilters(messages));
  }, [messages]);

  const filtered = useMemo(() => {
    const start = filters.dateStart ? new Date(`${filters.dateStart}T00:00:00`) : null;
    const end = filters.dateEnd ? new Date(`${filters.dateEnd}T23:59:59`) : null;
    const hourStart = Number(filters.hourStart);
    const hourEnd = Number(filters.hourEnd);
    const text = filters.textQuery.trim().toLowerCase();

    return messages.filter((message) => {
      if (filters.selectedAuthors.length > 0 && !filters.selectedAuthors.includes(message.author)) {
        return false;
      }

      if (start && message.timestamp < start) {
        return false;
      }
      if (end && message.timestamp > end) {
        return false;
      }

      const weekday = toMondayFirstWeekdayIndexFromJsDay(message.timestamp.getDay());
      if (filters.weekdays.length > 0 && !filters.weekdays.includes(weekday)) {
        return false;
      }

      const hour = message.timestamp.getHours();
      if (hour < hourStart || hour > hourEnd) {
        return false;
      }

      if (text && !message.content.toLowerCase().includes(text)) {
        return false;
      }

      return true;
    });
  }, [filters, messages]);

  if (messages.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-slate-900">Explorador de conversacion</h2>
        <p className="mt-2 text-sm text-slate-600">Sin mensajes para explorar.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Explorador de conversacion</h2>
        <p className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
          Mensajes mostrados: <span className="text-teal-700">{filtered.length}</span> / {messages.length}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 ring-1 ring-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Filtros</h3>

        <div className="mt-4 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Autor</p>
            <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {authors.map((author) => {
                const isSelected = filters.selectedAuthors.includes(author);
                return (
                  <label
                    key={author}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                      isSelected
                        ? "border-teal-300 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setFilters((current) => ({
                          ...current,
                          selectedAuthors: isSelected
                            ? current.selectedAuthors.filter((name) => name !== author)
                            : [...current.selectedAuthors, author]
                        }));
                      }}
                      className="accent-teal-700"
                    />
                    <span className="font-medium">{author}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rango de fechas</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={filters.dateStart}
                onChange={(event) => setFilters((current) => ({ ...current, dateStart: event.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring"
              />
              <input
                type="date"
                value={filters.dateEnd}
                onChange={(event) => setFilters((current) => ({ ...current, dateEnd: event.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dia de la semana</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, weekday) => {
                const active = filters.weekdays.includes(weekday);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        weekdays: active
                          ? current.weekdays.filter((day) => day !== weekday)
                          : [...current.weekdays, weekday]
                      }))
                    }
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-teal-600 bg-teal-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Franja horaria</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={filters.hourStart}
                onChange={(event) => setFilters((current) => ({ ...current, hourStart: event.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={`start-${hour}`} value={hour}>
                    {`${hour}`.padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <select
                value={filters.hourEnd}
                onChange={(event) => setFilters((current) => ({ ...current, hourEnd: event.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={`end-${hour}`} value={hour}>
                    {`${hour}`.padStart(2, "0")}:59
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="textQuery">
              Busqueda por texto
            </label>
            <input
              id="textQuery"
              type="text"
              value={filters.textQuery}
              onChange={(event) => setFilters((current) => ({ ...current, textQuery: event.target.value }))}
              placeholder="Buscar contenido..."
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-200 transition focus:border-teal-500 focus:ring"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 max-h-[34rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
        {filtered.map((message) => (
          <article
            key={message.id}
            className="mb-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm last:mb-0"
          >
            <header className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2 text-xs">
              <span className="rounded-md bg-teal-50 px-2 py-1 font-semibold text-teal-700 ring-1 ring-teal-100">
                {message.author}
              </span>
              <span className="text-slate-500">{formatDateTime(message.timestamp)}</span>
            </header>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
              {message.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
