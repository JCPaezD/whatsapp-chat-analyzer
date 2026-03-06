import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import { RecommendationResult, StatsResult } from "../types/message.types";
import { WEEKDAY_LABELS, formatDateTime, formatHourLabel } from "../utils/dateUtils";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

interface StatsDashboardProps {
  stats: StatsResult | null;
  recommendation: RecommendationResult | null;
}

const AUTHOR_COLOR_PALETTE = [
  "#4f7cff",
  "#f45b69",
  "#2fbf71",
  "#f4a259",
  "#8b6fc9",
  "#e76f9f",
  "#3fb8af",
  "#f08a5d",
  "#6c79ff",
  "#90be6d",
  "#4cc9f0",
  "#d65a31"
] as const;

function hexToRgba(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#334155",
        font: { size: 12 }
      }
    }
  },
  scales: {
    x: {
      ticks: { color: "#64748b" },
      grid: { color: "#e2e8f0" }
    },
    y: {
      ticks: { color: "#64748b" },
      grid: { color: "#e2e8f0" }
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: "#334155",
        font: { size: 12 }
      }
    }
  }
};

export function StatsDashboard({ stats, recommendation }: StatsDashboardProps): JSX.Element {
  if (!stats || stats.totalMessages === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-xl font-semibold text-slate-900">Panel de estadisticas</h2>
        <p className="mt-2 text-sm text-slate-600">Carga un archivo para visualizar metricas globales.</p>
      </section>
    );
  }

  const hours = Array.from({ length: 24 }, (_, index) => formatHourLabel(index));
  const authorLabels = stats.messagesByAuthor.map((item) => item.author);
  const authorCounts = stats.messagesByAuthor.map((item) => item.count);
  const sortedAuthorsForColor = [...authorLabels].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
  const authorColorMap = new Map<string, string>();
  sortedAuthorsForColor.forEach((author, index) => {
    authorColorMap.set(author, AUTHOR_COLOR_PALETTE[index % AUTHOR_COLOR_PALETTE.length]);
  });
  const authorColors = authorLabels.map((author) => authorColorMap.get(author) ?? AUTHOR_COLOR_PALETTE[0]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Panel de estadisticas</h2>
        <span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
          Vista global
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total mensajes" value={stats.totalMessages.toLocaleString()} highlight />
        <MetricCard label="Autores" value={`${stats.uniqueAuthors}`} />
        <MetricCard label="Media diaria" value={stats.averageMessagesPerDay.toFixed(2)} />
        <MetricCard label="Rafagas detectadas" value={`${stats.bursts.length}`} />
      </div>

      {stats.dateRange && (
        <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
          Rango temporal: {formatDateTime(stats.dateRange.start)} - {formatDateTime(stats.dateRange.end)}
        </p>
      )}

      <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-2">
        <ChartCard title="Mensajes por hora">
          <Bar
            data={{
              labels: hours,
              datasets: [{ label: "Mensajes", data: stats.messagesByHour, backgroundColor: "#0f766e" }]
            }}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Mensajes por dia de la semana">
          <Bar
            data={{
              labels: WEEKDAY_LABELS,
              datasets: [{ label: "Mensajes", data: stats.messagesByWeekday, backgroundColor: "#14b8a6" }]
            }}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Evolucion mensual">
          <Line
            data={{
              labels: stats.monthlyEvolution.map((item) => item.month),
              datasets: [
                {
                  label: "Mensajes",
                  data: stats.monthlyEvolution.map((item) => item.count),
                  borderColor: "#0f766e",
                  backgroundColor: "#99f6e4",
                  tension: 0.25,
                  pointBackgroundColor: "#0f766e"
                }
              ]
            }}
            options={chartOptions}
          />
        </ChartCard>

        <ChartCard title="Participacion por autor (%)">
          <Pie
            data={{
              labels: authorLabels,
              datasets: [
                {
                  label: "Mensajes",
                  data: authorCounts,
                  backgroundColor: authorColors.map((color) => hexToRgba(color, 0.72)),
                  borderColor: authorColors,
                  hoverBackgroundColor: authorColors.map((color) => hexToRgba(color, 0.9)),
                  borderWidth: 2
                }
              ]
            }}
            options={pieOptions}
          />
        </ChartCard>
      </div>

      <div className="mt-7 grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Heatmap dia x hora</h3>
          <div className="mt-3 w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-[760px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-100 p-1.5 text-left text-slate-600">Dia/Hora</th>
                  {hours.map((hour) => (
                    <th key={hour} className="border border-slate-200 bg-slate-100 p-1.5 text-slate-600">
                      {hour.slice(0, 2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.heatmapDayHour.map((row, day) => (
                  <tr key={WEEKDAY_LABELS[day]}>
                    <td className="border border-slate-200 bg-slate-50 p-1.5 font-medium text-slate-700">
                      {WEEKDAY_LABELS[day]}
                    </td>
                    {row.map((value, hour) => {
                      const max = Math.max(...stats.messagesByHour, 1);
                      const opacity = value / max;
                      return (
                        <td
                          key={`${day}-${hour}`}
                          className="border border-slate-200 p-1.5 text-center"
                          style={{
                            backgroundColor: `rgba(15, 118, 110, ${opacity})`,
                            color: opacity > 0.45 ? "white" : "#0f172a"
                          }}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recomendacion de horario</h3>
          {recommendation?.primaryWindow ? (
            <div className="mt-3 min-w-0 space-y-3 text-sm text-slate-700">
              <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                Ventana primaria:{" "}
                <strong className="text-teal-700">{formatHourLabel(recommendation.primaryWindow.hour)}</strong>{" "}
                (puntuacion {recommendation.primaryWindow.score.toFixed(2)})
              </p>
              <p className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                Ventana secundaria:{" "}
                <strong className="text-slate-900">
                  {recommendation.secondaryWindow
                    ? formatHourLabel(recommendation.secondaryWindow.hour)
                    : "No disponible"}
                </strong>
              </p>
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 leading-relaxed break-words text-slate-700">
                {recommendation.explanation}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No hay datos suficientes para recomendar horarios.</p>
          )}
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function MetricCard({ label, value, highlight = false }: MetricCardProps): JSX.Element {
  return (
    <div
      className={`min-w-0 rounded-xl border p-4 shadow-sm ${
        highlight
          ? "border-teal-200 bg-teal-50/70 ring-1 ring-teal-100"
          : "border-slate-200 bg-slate-50/70 ring-1 ring-slate-100"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${highlight ? "text-teal-800" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: JSX.Element;
}

function ChartCard({ title, children }: ChartCardProps): JSX.Element {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4 ring-1 ring-slate-100">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 h-64 min-w-0 rounded-lg bg-white p-2 ring-1 ring-slate-200 sm:h-72">{children}</div>
    </div>
  );
}
