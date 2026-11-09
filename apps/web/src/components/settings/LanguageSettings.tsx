import { useTranslation } from "../../i18n";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../ui/select";
import { SettingsRow, SettingsSection } from "./settingsLayout";
import { searchableSetting } from "./settingsSearch";

export function LanguageSettings() {
  const { locale, setLocale, t } = useTranslation();
  return (
    <SettingsSection id="language" title={t("Language")}>
      <SettingsRow
        {...searchableSetting("interface-language")}
        description={t("Choose the interface language for this device. Changes apply immediately.")}
        control={
          <Select
            value={locale}
            onValueChange={(value) => {
              if (value === "en" || value === "zh-CN") setLocale(value);
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full sm:w-44"
              aria-label={t("Interface language")}
            >
              <SelectValue>{locale === "zh-CN" ? "简体中文" : "English"}</SelectValue>
            </SelectTrigger>
            <SelectPopup align="end" alignItemWithTrigger={false}>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="zh-CN">简体中文</SelectItem>
            </SelectPopup>
          </Select>
        }
      />
    </SettingsSection>
  );
}
