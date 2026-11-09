import { expect, it, vi } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";
import { act, render } from "../../test/render";
import { setLocale, useTranslation } from "./index";
import { LOCALE_STORAGE_KEY } from "./locale";

function LanguagePicker() {
  const { locale, setLocale: chooseLocale, t } = useTranslation();
  return (
    <>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => {
          if (event.target.value === "en" || event.target.value === "zh-CN") {
            chooseLocale(event.target.value);
          }
        }}
      >
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </select>
      <p>{t("Settings")}</p>
      <p>{t("An untranslated message")}</p>
    </>
  );
}

it("switches existing clients immediately, persists the choice, and restores English", async () => {
  setLocale("en");
  // This picker only exercises the locale store and does not navigate.
  await using screen = await render(<LanguagePicker />, { router: false });
  await userEvent.selectOptions(screen.getByRole("combobox"), "zh-CN");
  await expect.element(screen.getByText("设置", { exact: true })).toBeVisible();
  expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-CN");
  expect(document.documentElement.lang).toBe("zh-CN");
  await expect.element(screen.getByText("An untranslated message")).toBeVisible();
  await screen.unmount();
  // A newly mounted client must retain the previous selection.
  await using remounted = await render(<LanguagePicker />, { router: false });
  await expect.element(remounted.getByRole("combobox")).toHaveValue("zh-CN");
  await userEvent.selectOptions(remounted.getByRole("combobox"), "en");
  await expect.element(remounted.getByText("Settings", { exact: true })).toBeVisible();
  expect(document.documentElement.lang).toBe("en");
});

it("follows other tabs and storage resets, and tolerates unavailable storage", async () => {
  setLocale("en");
  // Storage synchronization has no routing dependency.
  await using screen = await render(<LanguagePicker />, { router: false });
  await act(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh-CN");
    window.dispatchEvent(new StorageEvent("storage", { key: LOCALE_STORAGE_KEY }));
  });
  await expect.element(screen.getByText("设置", { exact: true })).toBeVisible();
  await act(() => {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  await expect.element(screen.getByText("Settings", { exact: true })).toBeVisible();
  using _storage = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "SecurityError");
  });
  await userEvent.selectOptions(screen.getByRole("combobox"), "zh-CN");
  await expect.element(screen.getByText("设置", { exact: true })).toBeVisible();
  await userEvent.selectOptions(screen.getByRole("combobox"), "en");
});
