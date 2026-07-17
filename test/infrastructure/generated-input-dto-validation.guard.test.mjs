import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../../apps/api/src/modules/documents/dto/update-generated-document-form-inputs.dto.ts",
    import.meta.url,
  ),
  "utf8",
);

for (const field of [
  "detentionArrest",
  "prosecutionCaseSuspension",
  "prosecutionCaseTermination",
]) {
  test(`${field} is an optional object accepted by whitelist validation`, () => {
    assert.match(
      source,
      new RegExp(
        `@IsOptional\\(\\)\\s*@IsObject\\(\\)\\s*${field}\\?: JsonObject;`,
      ),
    );
  });
}
