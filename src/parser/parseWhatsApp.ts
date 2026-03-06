import { Message } from "../types/message.types";
import { parseTwoDigitYear } from "../utils/dateUtils";

// This parser supports only the MVP WhatsApp export format:
// "[D/M/YY, H:MM:SS] Autor: Mensaje"
const HEADER_REGEX =
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2}),\s*(\d{1,2}):(\d{2}):(\d{2})\]\s*([^:]+):\s?(.*)$/;

// WhatsApp exports may contain invisible characters before the timestamp.
// We normalize the line before testing the header regex.
const INVISIBLE_CHARS_REGEX = /[\u200e\u200f\ufeff]/g;

function normalizeLineForHeaderDetection(line: string): string {
  return line.replace(INVISIBLE_CHARS_REGEX, "").trimStart();
}

function buildTimestamp(
  day: number,
  month: number,
  year: number,
  hour: number,
  minute: number,
  second: number
): Date {
  return new Date(parseTwoDigitYear(year), month - 1, day, hour, minute, second, 0);
}

export function parseWhatsApp(text: string): Message[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const messages: Message[] = [];

  let current: Message | null = null;

  for (const rawLine of lines) {
    const line = rawLine ?? "";
    const normalizedLine = normalizeLineForHeaderDetection(line);
    const match = normalizedLine.match(HEADER_REGEX);

    if (match) {
      if (current) {
        messages.push(current);
      }

      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      const hour = Number(match[4]);
      const minute = Number(match[5]);
      const second = Number(match[6]);
      const author = match[7].trim();
      const content = match[8] ?? "";

      current = {
        id: `${messages.length}-${day}-${month}-${year}-${hour}-${minute}-${second}`,
        timestamp: buildTimestamp(day, month, year, hour, minute, second),
        author,
        content
      };
      continue;
    }

    if (current) {
      current = {
        ...current,
        content: `${current.content}\n${line}`.trimEnd()
      };
    }
  }

  if (current) {
    messages.push(current);
  }

  return messages;
}
