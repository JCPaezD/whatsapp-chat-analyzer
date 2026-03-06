export interface Message {
  id: string;
  timestamp: Date;
  author: string;
  content: string;
}

export interface Burst {
  author: string;
  start: Date;
  end: Date;
  count: number;
  durationMinutes: number;
  hour: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface StatsResult {
  totalMessages: number;
  uniqueAuthors: number;
  dateRange: DateRange | null;
  averageMessagesPerDay: number;
  messagesByHour: number[];
  messagesByWeekday: number[];
  heatmapDayHour: number[][];
  monthlyEvolution: Array<{ month: string; count: number }>;
  messagesByAuthor: Array<{ author: string; count: number; participationPct: number }>;
  hourlyDistributionByAuthor: Record<string, number[]>;
  bursts: Burst[];
}

export interface RecommendationWindow {
  hour: number;
  score: number;
}

export interface RecommendationResult {
  primaryWindow: RecommendationWindow | null;
  secondaryWindow: RecommendationWindow | null;
  explanation: string;
}

export interface ExplorerFilters {
  selectedAuthors: string[];
  dateStart: string;
  dateEnd: string;
  weekdays: number[];
  hourStart: string;
  hourEnd: string;
  textQuery: string;
}
