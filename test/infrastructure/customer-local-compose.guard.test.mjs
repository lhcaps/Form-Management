import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('customer-local compose profile is loopback-only and never uses demo mode', () => {
  assert.equal(existsSync('docker-compose.customer-local.yml'), true);
  assert.equal(existsSync('.env.docker.customer-local.example'), true);
  const compose = readFileSync('docker-compose.customer-local.yml', 'utf8');
  assert.match(compose, /QLLAW_DEPLOYMENT_MODE:\s*customer-local/);
  assert.match(compose, /127\.0\.0\.1:\$\{WEB_PORT/);
  assert.doesNotMatch(compose, /QLLAW_DOCKER_MODE/);
});
