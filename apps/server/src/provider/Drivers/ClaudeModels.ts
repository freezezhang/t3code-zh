import type { ClaudeSettings, CustomModelSetting, ServerProviderModel } from "@t3tools/contracts";
import { readCustomModelEntries } from "@t3tools/shared/model";
import { fromLenientJson } from "@t3tools/shared/schemaJson";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { resolveClaudeConfigDirPath } from "./ClaudeSkills.ts";

const decodePicker = Schema.decodeUnknownEffect(
  fromLenientJson(
    Schema.Struct({
      modelPicker: Schema.optional(
        Schema.Struct({
          options: Schema.Array(Schema.Unknown),
          replaceBuiltInOptions: Schema.optional(Schema.Boolean),
        }),
      ),
    }),
  ),
);

export const readClaudeModelPicker = Effect.fn("ClaudeModels.readModelPicker")(function* (
  config: Pick<ClaudeSettings, "homePath">,
  environment: NodeJS.ProcessEnv,
  cwd?: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const home = yield* resolveClaudeConfigDirPath(config, environment, cwd);
  const contents = yield* fs
    .readFileString(path.join(home, "settings.json"))
    .pipe(Effect.orElseSucceed(() => "{}"));
  const settings = yield* decodePicker(contents).pipe(Effect.orElseSucceed(() => undefined));
  const models: ServerProviderModel[] = [];
  const seen = new Set<string>();
  for (const value of settings?.modelPicker?.options ?? []) {
    if (value === null || typeof value !== "object") continue;
    const entry = value as Record<string, unknown>;
    const slug = typeof entry.model === "string" ? entry.model.trim() : "";
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const label = typeof entry.label === "string" ? entry.label.trim() : "";
    // Discovered rows belong to the provider, not T3's editable custom-model settings.
    models.push({ slug, name: label || slug, isCustom: false, capabilities: null });
  }
  return {
    models,
    replaceBuiltInOptions:
      models.length > 0 && settings?.modelPicker?.replaceBuiltInOptions === true,
  };
});

export function mergeClaudeModelPicker(
  builtIn: ReadonlyArray<ServerProviderModel>,
  picker: {
    readonly models: ReadonlyArray<ServerProviderModel>;
    readonly replaceBuiltInOptions: boolean;
  },
  custom: ReadonlyArray<CustomModelSetting>,
): ReadonlyArray<ServerProviderModel> {
  const base = picker.replaceBuiltInOptions ? [] : builtIn;
  const seen = new Set([
    ...base.map((model) => model.slug),
    ...readCustomModelEntries(custom).map((model) => model.slug),
  ]);
  return [...base, ...picker.models.filter((model) => !seen.has(model.slug))];
}
