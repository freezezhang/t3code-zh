import { useSyncExternalStore } from "react";
import { LOCALE_STORAGE_KEY, resolveLocale, translate, type Locale } from "./locale";
import { zhCN } from "./zh-CN";

const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    return resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

let locale = readStoredLocale();

function updateDocumentLanguage() {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

function notify() {
  updateDocumentLanguage();
  for (const listener of listeners) listener();
}

updateDocumentLanguage();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return;
    locale = readStoredLocale();
    notify();
  });
}

export function setLocale(value: Locale) {
  locale = value;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
  } catch {
    // Private browsers may deny storage; keep the selection for this session.
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return locale;
}

function getServerSnapshot(): Locale {
  return "en";
}

const translateEnglish = (message: string) => message;
const translateChinese = (message: string) => translate("zh-CN", message, zhCN);

export function useTranslation() {
  const selectedLocale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    locale: selectedLocale,
    setLocale,
    t: selectedLocale === "zh-CN" ? translateChinese : translateEnglish,
  };
}
