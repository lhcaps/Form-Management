import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { traceRuntimeAuthorityConsumers } from './trace-runtime-authority-consumers.mjs';

test('trace reports 9 active consumers with CUTOVER_STATUS', () => {
  const result = traceRuntimeAuthorityConsumers();
  deepEqual(result.consumers.length, 9);
  for (const consumer of result.consumers) {
    ok(['LOCKED_AUTHORITY_ACTIVE', 'SHADOW_MODE', 'LEGACY_AUTHORITY_ACTIVE', 'BYPASS_DETECTED', 'MIXED_AUTHORITY_UNSAFE'].includes(consumer.CUTOVER_STATUS));
  }
});

test('trace reports 0 missing consumers', () => {
  const result = traceRuntimeAuthorityConsumers();
  deepEqual(result.summary.unknownConsumers, []);
});

test('every trace record has the required fields', () => {
  const result = traceRuntimeAuthorityConsumers();
  const required = ['SCRIPT', 'FIELD_AUTHORITY', 'REQUIREDNESS_AUTHORITY', 'SLOT_AUTHORITY', 'BINDING_AUTHORITY', 'SOURCE_HASH_AUTHORITY', 'ADAPTER_AUTHORITY', 'FALLBACK_PATHS', 'V1_MAPPING_REFERENCES', 'LOCKED_RUNTIME_LOADER_IMPORTED', 'CUTOVER_STATUS'];
  for (const consumer of result.consumers) {
    for (const field of required) ok(field in consumer, `${consumer.SCRIPT} missing ${field}`);
  }
});
