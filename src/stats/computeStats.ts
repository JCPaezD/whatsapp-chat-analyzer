import { Burst, Message, StatsResult } from "../types/message.types";
import {
  diffDaysInclusive,
  diffMinutes,
  getDayKey,
  getMonthKey,
  toMondayFirstWeekdayIndexFromJsDay
} from "../utils/dateUtils";

// Burst detection threshold: 5 messages within 5 minutes.
const DEFAULT_BURST_MIN_MESSAGES = 5;
const DEFAULT_BURST_WINDOW_MINUTES = 5;

function sortByTimestamp(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function detectBursts(
  messages: Message[],
  minMessages: number = DEFAULT_BURST_MIN_MESSAGES,
  windowMinutes: number = DEFAULT_BURST_WINDOW_MINUTES
): Burst[] {
  const byAuthor = new Map<string, Message[]>();
  for (const message of messages) {
    const list = byAuthor.get(message.author) ?? [];
    list.push(message);
    byAuthor.set(message.author, list);
  }

  const bursts: Burst[] = [];

  for (const [author, authorMessages] of byAuthor.entries()) {
    const sorted = sortByTimestamp(authorMessages);
    if (sorted.length < minMessages) {
      continue;
    }

    let segment: Message[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i += 1) {
      const current = sorted[i];
      const previous = sorted[i - 1];
      const gap = diffMinutes(current.timestamp, previous.timestamp);

      if (gap <= windowMinutes) {
        segment.push(current);
      } else {
        if (segment.length >= minMessages) {
          bursts.push(buildBurst(author, segment));
        }
        segment = [current];
      }
    }

    if (segment.length >= minMessages) {
      bursts.push(buildBurst(author, segment));
    }
  }

  return [...bursts].sort((a, b) => a.start.getTime() - b.start.getTime());
}

function buildBurst(author: string, messages: Message[]): Burst {
  const start = messages[0].timestamp;
  const end = messages[messages.length - 1].timestamp;
  const hourCounts = new Array<number>(24).fill(0);
  for (const message of messages) {
    hourCounts[message.timestamp.getHours()] += 1;
  }
  const dominantHour = hourCounts.reduce(
    (bestHour, count, hour, arr) => (count > arr[bestHour] ? hour : bestHour),
    0
  );

  return {
    author,
    start,
    end,
    count: messages.length,
    durationMinutes: diffMinutes(start, end),
    hour: dominantHour
  };
}

export function computeStats(messages: Message[]): StatsResult {
  const sorted = sortByTimestamp(messages);
  const totalMessages = sorted.length;

  if (totalMessages === 0) {
    return {
      totalMessages: 0,
      uniqueAuthors: 0,
      dateRange: null,
      averageMessagesPerDay: 0,
      messagesByHour: new Array<number>(24).fill(0),
      messagesByWeekday: new Array<number>(7).fill(0),
      heatmapDayHour: Array.from({ length: 7 }, () => new Array<number>(24).fill(0)),
      monthlyEvolution: [],
      messagesByAuthor: [],
      hourlyDistributionByAuthor: {},
      bursts: []
    };
  }

  const firstDate = sorted[0].timestamp;
  const lastDate = sorted[sorted.length - 1].timestamp;
  const dateRange = { start: firstDate, end: lastDate };
  const totalDays = diffDaysInclusive(firstDate, lastDate);

  const authorsSet = new Set<string>();
  const messagesByHour = new Array<number>(24).fill(0);
  const messagesByWeekday = new Array<number>(7).fill(0);
  const heatmapDayHour = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const monthlyMap = new Map<string, number>();
  const byAuthorMap = new Map<string, number>();
  const hourlyDistributionByAuthor: Record<string, number[]> = {};

  for (const message of sorted) {
    const { author, timestamp } = message;
    const hour = timestamp.getHours();
    const weekday = toMondayFirstWeekdayIndexFromJsDay(timestamp.getDay());
    const monthKey = getMonthKey(timestamp);

    authorsSet.add(author);
    messagesByHour[hour] += 1;
    messagesByWeekday[weekday] += 1;
    heatmapDayHour[weekday][hour] += 1;
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1);
    byAuthorMap.set(author, (byAuthorMap.get(author) ?? 0) + 1);

    if (!hourlyDistributionByAuthor[author]) {
      hourlyDistributionByAuthor[author] = new Array<number>(24).fill(0);
    }
    hourlyDistributionByAuthor[author][hour] += 1;
  }

  const monthlyEvolution = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));

  const messagesByAuthor = [...byAuthorMap.entries()]
    .map(([author, count]) => ({
      author,
      count,
      participationPct: totalMessages === 0 ? 0 : (count / totalMessages) * 100
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMessages,
    uniqueAuthors: authorsSet.size,
    dateRange,
    averageMessagesPerDay: totalDays === 0 ? 0 : totalMessages / totalDays,
    messagesByHour,
    messagesByWeekday,
    heatmapDayHour,
    monthlyEvolution,
    messagesByAuthor,
    hourlyDistributionByAuthor,
    bursts: detectBursts(sorted)
  };
}

export function groupDistinctDaysByHour(messages: Message[]): number[] {
  const distinctDayHour = Array.from({ length: 24 }, () => new Set<string>());
  for (const message of messages) {
    const hour = message.timestamp.getHours();
    distinctDayHour[hour].add(getDayKey(message.timestamp));
  }
  return distinctDayHour.map((set) => set.size);
}
