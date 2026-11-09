import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import { readClaudeModelPicker, mergeClaudeModelPicker } from "./ClaudeModels.ts";

it.layer(NodeServices.layer)("Claude model discovery", (it) => {
  it.effect(
    "reads Magpie models without modifying IDs, refreshes changes, and respects the instance home",
    () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const home = yield* fs.makeTempDirectoryScoped();
        const file = path.join(home, "settings.json");
        yield* fs.writeFileString(
          file,
          `{
        // Magpie preserves comments and may advertise more than 32 models.
        "modelPicker": { "replaceBuiltInOptions": true, "options": ${JSON.stringify([
          { model: "auto/deepseek-v4[1m]", label: "DeepSeek · routing group" },
          ...Array.from({ length: 40 }, (_, i) => ({ model: `proxy/model-${i}` })),
          { model: "auto/deepseek-v4[1m]", label: "duplicate" },
          null,
          { model: " " },
          { model: 123 },
        ])}, },
      }`,
        );
        const first = yield* readClaudeModelPicker({ homePath: "" }, { CLAUDE_CONFIG_DIR: home });
        assert.strictEqual(first.models.length, 41);
        assert.strictEqual(first.models[0]?.slug, "auto/deepseek-v4[1m]");
        assert.strictEqual(first.models[0]?.name, "DeepSeek · routing group");
        assert.strictEqual(first.replaceBuiltInOptions, true);
        yield* fs.writeFileString(file, '{"modelPicker":{"options":[{"model":"group/new"}]}}');
        const next = yield* readClaudeModelPicker(
          { homePath: home },
          { CLAUDE_CONFIG_DIR: "/ignored" },
        );
        assert.deepEqual(
          next.models.map((model) => model.slug),
          ["group/new"],
        );
        assert.strictEqual(next.replaceBuiltInOptions, false);
        const builtIn = [
          { slug: "builtin", name: "Built in", isCustom: false, capabilities: null },
        ];
        assert.deepEqual(mergeClaudeModelPicker(builtIn, next, ["group/new"]), builtIn);
        assert.deepEqual(
          mergeClaudeModelPicker(builtIn, first, []).map((model) => model.slug),
          first.models.map((model) => model.slug),
        );
      }),
  );

  it.effect(
    "keeps the built-in catalog when the file is missing, corrupt, or has no valid picker entries",
    () =>
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem;
        const path = yield* Path.Path;
        const home = yield* fs.makeTempDirectoryScoped();
        for (const contents of [
          undefined,
          "{broken",
          "{}",
          '{"modelPicker":{"replaceBuiltInOptions":true,"options":[null]}}',
        ]) {
          if (contents !== undefined)
            yield* fs.writeFileString(path.join(home, "settings.json"), contents);
          assert.deepEqual(yield* readClaudeModelPicker({ homePath: home }, {}), {
            models: [],
            replaceBuiltInOptions: false,
          });
        }
      }),
  );
});
