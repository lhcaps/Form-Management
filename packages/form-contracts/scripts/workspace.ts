import fs from "node:fs";
import path from "node:path";
import {
  adaptV1Contract,
  compileContract,
  formContractV2Schema,
  type FormContractV2,
  type V1Contract,
} from "../src/index.js";

export function repoRoot(): string {
  return path.resolve(import.meta.dirname, "../../..");
}

export function lockedContractFiles(): string[] {
  const directory = path.join(
    repoRoot(),
    "docs",
    "audit",
    "docx",
    "contracts",
    "locked",
  );
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(directory, file));
}

export function readAsV2(file: string): FormContractV2 {
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  const v2 = formContractV2Schema.safeParse(raw);
  if (v2.success) return v2.data;
  return adaptV1Contract(raw as V1Contract);
}

export function compileFile(file: string) {
  const result = compileContract(readAsV2(file));
  return { file, result };
}
