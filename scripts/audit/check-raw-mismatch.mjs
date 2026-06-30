import { readFileSync } from 'fs';
import { join } from 'path';

const sot = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'audit', 'sot-rebase-v1', 'latest.json'), 'utf8')
);

// Find BM-001 issues from the perBm data
// The structure might be different - let me check
console.log('SOT keys:', Object.keys(sot).slice(0, 20));

// Check if perBm exists
if (sot.perBm) {
  const bm001 = sot.perBm.find(r => r.templateCode === 'BM-001');
  console.log('BM-001 found');
  if (bm001?.issues) {
    const raw = bm001.issues.filter(i => i.type === 'RAW_PATTERN_MISMATCH');
    console.log('RAW_PATTERN count:', raw.length);
    raw.slice(0, 3).forEach(i => {
      console.log(`  slotId=${i.slotId} expected=${i.expected} actual=${i.actual} generic=${i.generic}`);
    });
  }
} else {
  console.log('No perBm array');
  // Check the structure of the file
  if (sot.results) {
    const bm001 = sot.results.find(r => r.templateCode === 'BM-001');
    if (bm001?.issues) {
      const raw = bm001.issues.filter(i => i.type === 'RAW_PATTERN_MISMATCH');
      console.log('RAW_PATTERN count:', raw.length);
      raw.slice(0, 3).forEach(i => {
        console.log(`  slotId=${i.slotId} expected=${i.expected} actual=${i.actual} generic=${i.generic}`);
      });
    }
  }
}

// Also check the otRongAutoapproved file for BM-001
const otrong = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'audit', 'sot-rebase-v1', 'otrong-autoapproved.latest.json'), 'utf8')
);
const bm001Otrong = otrong.filter(i => i.templateCode === 'BM-001');
console.log('\nOTRONG for BM-001:', bm001Otrong.length);
