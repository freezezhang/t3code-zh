export type Locale = "en" | "zh-CN";

export const LOCALE_STORAGE_KEY = "t3code:locale";

export function resolveLocale(value: string | null): Locale {
  return value === "zh-CN" ? "zh-CN" : "en";
}

export function translate(
  locale: Locale,
  message: string,
  messages: Readonly<Record<string, string>>,
): string {
  return locale === "zh-CN" ? (messages[message] ?? message) : message;
}
