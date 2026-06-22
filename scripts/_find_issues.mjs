import { readdirSync } from 'node:fs';
import { verifyContracts } from './docx-contract/verify-contracts.mjs';

const result = await verifyContracts();
for (const issue of result.issues ?? []) {
  if (issue.severity === 'error') {
    console.log(`ERROR [${issue.contract}]: ${issue.message}`);
    if (issue.details) console.log(JSON.stringify(issue.details, null, 2));
  }
}
