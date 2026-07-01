import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRuntimeTemplateDraftKey,
  loadRuntimeTemplateDraft,
  saveRuntimeTemplateDraft,
} from "./runtime-template-draft";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

test("runtime template draft keys are scoped by template and contract hash", () => {
  assert.equal(
    buildRuntimeTemplateDraftKey(" bm-001 ", "hash-a"),
    "qllaw:runtime-template-draft:BM-001:hash-a",
  );
});

test("runtime template drafts round-trip through storage", () => {
  const storage = new MemoryStorage();
  const data = { receiver: { fullName: "Nguyen Van A" } };

  saveRuntimeTemplateDraft(storage, "BM-001", "hash-a", data);

  assert.deepEqual(loadRuntimeTemplateDraft(storage, "BM-001", "hash-a"), data);
  assert.equal(loadRuntimeTemplateDraft(storage, "BM-001", "hash-b"), null);
});

test("runtime template draft loading ignores corrupt JSON", () => {
  const storage = new MemoryStorage();
  storage.setItem(buildRuntimeTemplateDraftKey("BM-001", "hash-a"), "{");

  assert.equal(loadRuntimeTemplateDraft(storage, "BM-001", "hash-a"), null);
});
