import { Burst, Message, RecommendationResult } from "../types/message.types";
import { diffDaysInclusive, formatHourLabel, getDayKey } from "../utils/dateUtils";

// Anti-burst penalty: if activity is dominated by a short burst,
// the hour score is multiplied by 0.6.
const BURST_DOMINANCE_THRESHOLD = 0.4;
const BURST_DURATION_THRESHOLD_MINUTES = 20;
const BURST_PENALTY_FACTOR = 0.6;

export function computeRecommendation(messages: Message[], bursts: Burst[] = []): RecommendationResult {
  if (messages.length === 0) {
    return {
      primaryWindow: null,
      secondaryWindow: null,
      explanation: "No hay datos suficientes para calcular recomendaciones."
    };
  }

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const start = sorted[0].timestamp;
  const end = sorted[sorted.length - 1].timestamp;
  const totalDays = Math.max(1, diffDaysInclusive(start, end));

  const messagesByHour = new Array<number>(24).fill(0);
  const distinctDaysByHour = Array.from({ length: 24 }, () => new Set<string>());
  for (const message of sorted) {
    const hour = message.timestamp.getHours();
    messagesByHour[hour] += 1;
    distinctDaysByHour[hour].add(getDayKey(message.timestamp));
  }

  const scores = new Array<number>(24).fill(0);
  const antiBurstFactors = new Array<number>(24).fill(1);

  for (let hour = 0; hour < 24; hour += 1) {
    const totalHourMessages = messagesByHour[hour];
    if (totalHourMessages === 0) {
      scores[hour] = 0;
      continue;
    }

    const hourShortBursts = bursts.filter(
      (burst) => burst.hour === hour && burst.durationMinutes < BURST_DURATION_THRESHOLD_MINUTES
    );
    const strongestBurstShare = hourShortBursts.reduce(
      (maxShare, burst) => Math.max(maxShare, burst.count / totalHourMessages),
      0
    );

    if (strongestBurstShare > BURST_DOMINANCE_THRESHOLD) {
      antiBurstFactors[hour] = BURST_PENALTY_FACTOR;
    }

    const avgActivityPerDay = totalHourMessages / totalDays;
    const distinctDays = distinctDaysByHour[hour].size;
    scores[hour] = avgActivityPerDay * distinctDays * antiBurstFactors[hour];
  }

  const rankedHours = scores
    .map((score, hour) => ({ hour, score }))
    .sort((a, b) => b.score - a.score);

  const primaryWindow = rankedHours[0].score > 0 ? rankedHours[0] : null;
  const secondaryWindow = primaryWindow
    ? rankedHours.find((candidate) => candidate.score > 0 && Math.abs(candidate.hour - primaryWindow.hour) >= 2) ?? null
    : null;

  const explanation = buildExplanation(primaryWindow, secondaryWindow, messagesByHour, distinctDaysByHour, antiBurstFactors, totalDays);

  return {
    primaryWindow,
    secondaryWindow,
    explanation
  };
}

function buildExplanation(
  primary: { hour: number; score: number } | null,
  secondary: { hour: number; score: number } | null,
  messagesByHour: number[],
  distinctDaysByHour: Array<Set<string>>,
  antiBurstFactors: number[],
  totalDays: number
): string {
  if (!primary) {
    return "No se identificaron horas con actividad consistente.";
  }

  const primaryAvg = messagesByHour[primary.hour] / totalDays;
  const primaryDays = distinctDaysByHour[primary.hour].size;
  const primaryBurstText =
    antiBurstFactors[primary.hour] < 1
      ? "Se aplico penalizacion anti-rafaga por concentracion puntual."
      : "No se detecto concentracion excesiva en una unica rafaga.";

  const secondaryText = secondary
    ? `Como alternativa separada, ${formatHourLabel(secondary.hour)} tambien presenta una señal estable (puntuacion ${secondary.score.toFixed(2)}).`
    : "No se encontro una segunda ventana con separacion minima de 2 horas.";

  return `La ventana primaria recomendada es ${formatHourLabel(primary.hour)} (puntuacion ${primary.score.toFixed(2)}), con actividad media de ${primaryAvg.toFixed(2)} mensajes/dia en ${primaryDays} dias distintos. ${primaryBurstText} ${secondaryText}`;
}
