import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FormActionBar } from "./form-action-bar";

function renderActionBar(props: Parameters<typeof FormActionBar>[0] = {}) {
  return renderToStaticMarkup(
    createElement(FormActionBar, props, createElement("button", null, "Save")),
  );
}

test("FormActionBar renders a bottom sticky print-hidden action surface by default", () => {
  const markup = renderActionBar({ id: "actions" });

  assert.match(markup, /id="actions"/);
  assert.match(markup, /sticky bottom-4/);
  assert.match(markup, /print:hidden/);
  assert.match(markup, /shadow-lg/);
  assert.doesNotMatch(markup, /shadow-xl/);
});

test("FormActionBar supports top sticky positioning", () => {
  const topMarkup = renderActionBar({ position: "top" });

  assert.match(topMarkup, /sticky top-3/);
  assert.match(topMarkup, />Save</);
  assert.doesNotMatch(topMarkup, /sticky bottom-4/);
});

test("FormActionBar supports non-sticky positioning without changing children", () => {
  const markup = renderActionBar({
    className: "justify-between",
    position: "none",
  });

  assert.doesNotMatch(markup, /sticky bottom-4/);
  assert.doesNotMatch(markup, /sticky top-3/);
  assert.match(markup, />Save</);
  assert.match(markup, /justify-between/);
});

test("FormActionBar can remain print-visible when requested", () => {
  const markup = renderActionBar({ printHidden: false });

  assert.doesNotMatch(markup, /print:hidden/);
});
