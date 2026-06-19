import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkJsonEndpoint,
  checkTextEndpoint,
} from '../scripts/dev-healthcheck.mjs';

test('checkTextEndpoint accepts an HTML web response', async () => {
  const result = await checkTextEndpoint('http://web.test', {
    fetchImpl: async () =>
      new Response('<!doctype html><title>QUANLYVKS</title>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.match(result.body, /QUANLYVKS/);
});

test('checkJsonEndpoint reports invalid JSON without throwing', async () => {
  const result = await checkJsonEndpoint('http://api.test', {
    fetchImpl: async () =>
      new Response('<!doctype html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 502);
  assert.match(result.error, /valid JSON/);
});

test('endpoint checks report fetch rejection as an unavailable service', async () => {
  const result = await checkJsonEndpoint('http://api.test', {
    fetchImpl: async () => {
      throw new TypeError('Failed to fetch');
    },
  });

  assert.deepEqual(result, {
    ok: false,
    status: 0,
    error: 'Failed to fetch',
  });
});
