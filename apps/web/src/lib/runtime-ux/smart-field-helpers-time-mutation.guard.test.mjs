/**
 * Mutation suite for the BM-001 time-input control state machine.
 *
 * The rendered `TimeSmartControl` is a thin React shell over a fixed
 * state machine. The contract is duplicated here as pure JS so the
 * tests can run via `node --test` without a DOM or TypeScript
 * transpilation. Each block pins one defect class that has
 * historically affected the BM-001 input.
 *
 * Mutation classes tested:
 *  A. partial input normalized to empty canonical stays visible in the buffer;
 *  B. stale derived canonical does NOT overwrite an active edit;
 *  C. demo defaults rehydrate on mount;
 *  D. start and end keys are independent;
 *  E. --:00 / --:-- placeholders are never stored as data;
 *  F. rerender with equal canonical value does not erase the buffer.
 *
 * Run with:
 *   node --test apps/web/src/lib/runtime-ux/smart-field-helpers-time-mutation.guard.test.mjs
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function canonicalizeTimeValue(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return "";
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(trimmed)) {
    const hours = Number(trimmed.slice(0, 2));
    const minutes = Number(trimmed.slice(2));
    if (hours <= 23 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    return "";
  }
  return "";
}

function normalizeTimeEditBuffer(value) {
  const sanitized = String(value).replace(/[^\d:]/g, "");
  const digits = sanitized.replace(/:/g, "").slice(0, 4);
  if (digits.length === 4) {
    return canonicalizeTimeValue(digits) || digits;
  }
  if (sanitized.includes(":")) {
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2);
    return `${hours}:${minutes}`.slice(0, 5);
  }
  return digits;
}

function transition(state, action) {
  if (action.type === "mount") {
    return {
      buffer: normalizeTimeEditBuffer(state.canonicalValue),
      lastCanonical: state.canonicalValue,
      canonicalValue: state.canonicalValue,
    };
  }
  if (action.type === "userType") {
    const nextBuffer = normalizeTimeEditBuffer(action.payload ?? "");
    const canonical = canonicalizeTimeValue(nextBuffer);
    if (canonical.length > 0 && canonical !== state.canonicalValue) {
      return {
        buffer: nextBuffer,
        lastCanonical: canonical,
        canonicalValue: canonical,
      };
    }
    return {
      buffer: nextBuffer,
      lastCanonical: state.lastCanonical,
      canonicalValue: state.canonicalValue,
    };
  }
  if (action.type === "blur") {
    const canonical = canonicalizeTimeValue(state.buffer);
    if (canonical.length === 0 && state.buffer.trim().length > 0) {
      return { buffer: "", lastCanonical: "", canonicalValue: "" };
    }
    if (canonical === state.canonicalValue) return state;
    return {
      buffer: state.buffer,
      lastCanonical: canonical,
      canonicalValue: canonical,
    };
  }
  if (action.type === "commitCanonicalFromExternal") {
    if (action.payload === state.lastCanonical) return state;
    return {
      buffer: normalizeTimeEditBuffer(action.payload),
      lastCanonical: action.payload,
      canonicalValue: action.payload,
    };
  }
  return state;
}

const initial = () => ({ buffer: "", lastCanonical: "", canonicalValue: "" });

describe("mutation A: partial input normalized to empty", () => {
  it("partial digits stay visible in the buffer; canonical stays empty", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "0" });
    assert.equal(s.buffer, "0");
    assert.equal(s.canonicalValue, "");
    s = transition(s, { type: "userType", payload: "00" });
    assert.equal(s.buffer, "00");
    assert.equal(s.canonicalValue, "");
    s = transition(s, { type: "userType", payload: "090" });
    assert.equal(s.buffer, "090");
    assert.equal(s.canonicalValue, "");
    s = transition(s, { type: "userType", payload: "0900" });
    assert.equal(s.canonicalValue, "09:00");
    assert.equal(s.buffer, "09:00");
  });
});

describe("mutation A.blur: partial buffer clears on blur", () => {
  it("partial digit clears on blur; never stored", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "0" });
    s = transition(s, { type: "blur" });
    assert.equal(s.canonicalValue, "");
    assert.equal(s.buffer, "");
  });
});

describe("mutation B: stale derived value overwriting active input", () => {
  it("does not overwrite when canonical value already matches last commit", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "09" });
    s = transition(s, { type: "userType", payload: "0900" });
    assert.equal(s.canonicalValue, "09:00");
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "09:00" });
    assert.equal(s.buffer, "09:00");
    assert.equal(s.canonicalValue, "09:00");
  });

  it("does not bleed an equal canonical value into the active edit buffer", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "0" });
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "11:00" });
    assert.equal(s.canonicalValue, "11:00");
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "11:00" });
    s = transition(s, { type: "userType", payload: "1" });
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "11:00" });
    assert.equal(s.buffer, "1", "active edit survives equal canonical");
  });
});

describe("mutation C: demo default reapplied after typing", () => {
  it("demo default applies at mount; typing changes the buffer", () => {
    let s = { buffer: "", lastCanonical: "09:00", canonicalValue: "09:00" };
    s = transition(s, { type: "mount" });
    assert.equal(s.buffer, "09:00");
    s = transition(s, { type: "userType", payload: "1405" });
    assert.equal(s.canonicalValue, "14:05");
    assert.equal(s.buffer, "14:05");
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "14:05" });
    assert.equal(s.buffer, "14:05");
  });
});

describe("mutation D: start and end keys are independent", () => {
  it("typing in start key does not affect end key and vice versa", () => {
    let s1 = initial();
    let s2 = initial();
    s1 = transition(s1, { type: "mount" });
    s2 = transition(s2, { type: "mount" });
    s1 = transition(s1, { type: "userType", payload: "0900" });
    assert.equal(s1.canonicalValue, "09:00");
    assert.equal(s2.canonicalValue, "");
    s2 = transition(s2, { type: "userType", payload: "1030" });
    assert.equal(s2.canonicalValue, "10:30");
    assert.equal(s1.canonicalValue, "09:00");
  });
});

describe("mutation E: placeholder is never submitted as data", () => {
  it("empty buffer commits empty canonical; no --:00 produced", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "blur" });
    assert.equal(s.canonicalValue, "");
    assert.ok(!s.canonicalValue.includes("--"));
  });

  it("invalid buffer (99:99) clears on blur, never stores garbage", () => {
    let s = initial();
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "9999" });
    assert.equal(s.canonicalValue, "");
    s = transition(s, { type: "blur" });
    assert.equal(s.canonicalValue, "");
    assert.ok(!s.canonicalValue.includes("--"));
  });
});

describe("mutation F: rerender erasing value", () => {
  it("rerender with same canonical value keeps buffer intact", () => {
    let s = { buffer: "", lastCanonical: "10:30", canonicalValue: "10:30" };
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "userType", payload: "1" });
    assert.equal(s.buffer, "1");
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "10:30" });
    assert.equal(s.buffer, "1", "rerender did not erase typed digit");
    assert.equal(s.canonicalValue, "10:30");
  });

  it("rerender with new canonical value updates both sides coherently", () => {
    let s = { buffer: "", lastCanonical: "09:00", canonicalValue: "09:00" };
    s = transition(s, { type: "mount" });
    s = transition(s, { type: "commitCanonicalFromExternal", payload: "14:05" });
    assert.equal(s.canonicalValue, "14:05");
    assert.equal(s.buffer, "14:05");
    assert.match(s.canonicalValue, HHMM);
  });
});