import { execFileSync, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocumentsService } from '../apps/api/src/modules/documents/documents.service';
import { PrismaService } from '../apps/api/src/prisma/prisma.service';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runId = `qllaw-bridge-proof-${Date.now()}`;
const dbUrl = 'mysql://bridge_proof:bridge-proof-pass@127.0.0.1:3310/bridge_proof';

function docker(args: string[], allowFailure = false): void {
  const result = spawnSync('docker', args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr || result.stdout || `docker ${args.join(' ')} failed`);
  }
}

function cleanup(): void {
  docker(['rm', '-f', runId], true);
  docker(['volume', 'rm', '-f', runId], true);
}

async function waitForMariaDb(): Promise<void> {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const ping = spawnSync(
      'docker',
      ['exec', runId, 'healthcheck.sh', '--connect', '--innodb_initialized'],
      { cwd: root, encoding: 'utf8', windowsHide: true },
    );
    if (ping.status === 0) return;
    await delay(2_000);
  }
  throw new Error('Disposable MariaDB did not become ready.');
}

async function main(): Promise<void> {
  cleanup();
  docker([
    'run', '-d', '--name', runId,
    '--mount', `type=volume,source=${runId},target=/var/lib/mysql`,
    '-p', '127.0.0.1:3310:3306',
    '-e', 'MARIADB_ROOT_PASSWORD=bridge-root-pass',
    '-e', 'MARIADB_DATABASE=bridge_proof',
    '-e', 'MARIADB_USER=bridge_proof',
    '-e', 'MARIADB_PASSWORD=bridge-proof-pass',
    'mariadb:11',
    '--character-set-server=utf8mb4',
    '--collation-server=utf8mb4_unicode_ci',
  ]);
  await waitForMariaDb();

  execFileSync(
    process.execPath,
    [resolve(root, 'apps/api/node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    {
      cwd: resolve(root, 'apps/api'),
      env: { ...process.env, DATABASE_URL: dbUrl, CI: 'true' },
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  process.env.DATABASE_URL = dbUrl;
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const agency = await prisma.agencies.create({
      data: {
        agency_code: 'VKS-BRIDGE-PROOF',
        agency_name: 'Bridge Proof Agency',
        agency_type: 'VKS_TINH',
      },
    });
    const official = await prisma.officials.create({
      data: { agency_id: agency.id, full_name: 'Bridge Proof Official' },
    });
    const caseItem = await prisma.cases.create({
      data: {
        agency_id: agency.id,
        case_code: 'CASE-BRIDGE-PROOF',
        case_title: 'Bridge Proof Case',
      },
    });
    const template = await prisma.templates.create({
      data: {
        template_code: 'BM-002',
        template_name: 'Bridge Proof Template',
        render_scope: 'CASE_LEVEL',
      },
    });
    await prisma.form_contract_versions.create({
      data: {
        template_id: template.id,
        scope_key: 'GLOBAL',
        version_no: 1,
        status: 'PUBLISHED',
        template_hash: 'bridge-proof-template-hash',
        contract_hash: 'bridge-proof-contract-hash',
        draft_json: {},
        created_by_official_id: official.id,
        published_by_official_id: official.id,
        published_at: new Date(),
      },
    });

    const service = new DocumentsService(prisma);
    const request = {
      templateCode: 'BM-002',
      caseId: String(caseItem.id),
      source: 'TEMPLATE_BRIDGE' as const,
      officialId: official.id,
      agencyId: agency.id,
      officialName: official.full_name,
    };
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => service.createDraftFromTemplate(request)),
    );
    const documentIds = new Set(responses.map((response) => response.documentId));
    const createdDrafts = await prisma.generated_documents.findMany({
      where: { case_id: caseItem.id, template_id: template.id },
      orderBy: { id: 'asc' },
    });
    if (documentIds.size !== 1 || createdDrafts.length !== 1) {
      throw new Error(
        `Concurrent proof failed: ids=${[...documentIds].join(',')} documents=${createdDrafts.length}`,
      );
    }

    await prisma.generated_documents.update({
      where: { id: createdDrafts[0].id },
      data: { review_status: 'WAITING_REVIEW' },
    });
    const afterReview = await service.createDraftFromTemplate(request);
    if (afterReview.reused || afterReview.documentId === String(createdDrafts[0].id)) {
      throw new Error('WAITING_REVIEW document was incorrectly reused.');
    }

    const otherOfficial = await prisma.officials.create({
      data: { agency_id: agency.id, full_name: 'Second Bridge Proof Official' },
    });
    const otherActor = await service.createDraftFromTemplate({
      ...request,
      officialId: otherOfficial.id,
      officialName: otherOfficial.full_name,
    });
    if (otherActor.reused || otherActor.documentId === afterReview.documentId) {
      throw new Error('A different official reused another official bridge draft.');
    }

    const finalCount = await prisma.generated_documents.count({
      where: { case_id: caseItem.id, template_id: template.id },
    });
    if (finalCount !== 3) {
      throw new Error(`Expected 3 documents after review/ownership checks; got ${finalCount}.`);
    }

    console.log(JSON.stringify({
      proof: 'TEMPLATE_BRIDGE_CONCURRENCY_PASS',
      concurrentRequests: 20,
      uniqueDocumentIds: documentIds.size,
      documentsAfterConcurrentRequests: createdDrafts.length,
      waitingReviewReused: afterReview.reused,
      ownershipIsolation: !otherActor.reused,
      finalDocuments: finalCount,
    }));
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => cleanup())
  .catch((error: unknown) => {
    cleanup();
    console.error(error);
    process.exitCode = 1;
  });
