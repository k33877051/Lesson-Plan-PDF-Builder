import { en } from "./messages/en";
import { th } from "./messages/th";
import type { Locale, Messages } from "./types";

export type { Locale, Messages } from "./types";
export { LOCALES, LOCALE_LABELS } from "./types";

const messagesByLocale: Record<Locale, Messages> = { th, en };

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function createTranslator(locale: Locale) {
  const messages = messagesByLocale[locale] ?? messagesByLocale.th;

  return function translate(
    key: string,
    params?: Record<string, string | number>
  ): string {
    const value = getNestedValue(messages, key) ?? key;

    if (!params) return value;

    return value.replace(/\{(\w+)\}/g, (_, paramKey: string) =>
      String(params[paramKey] ?? "")
    );
  };
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale.th;
}

export function formatDateByLocale(date: Date | string, locale: Locale): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const intlLocale = locale === "en" ? "en-US" : "th-TH";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatNumberByLocale(value: number, locale: Locale): string {
  const intlLocale = locale === "en" ? "en-US" : "th-TH";
  return value.toLocaleString(intlLocale);
}
