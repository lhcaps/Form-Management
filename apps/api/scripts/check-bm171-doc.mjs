import { PrismaClient } from "@prisma/client";
import { createPrismaMariaDbAdapter } from "../../../scripts/prisma-mariadb-adapter.mjs";
const p = new PrismaClient({ adapter: createPrismaMariaDbAdapter() });
(async () => {
  const docs = await p.generated_documents.findMany({
    where: { templates: { template_code: "BM-171" } },
    include: { templates: true },
    take: 5,
    orderBy: { id: "desc" },
  });
  console.log(
    JSON.stringify(
      docs.map((d) => ({
        id: String(d.id),
        document_code: d.document_code,
        template_code: d.templates.template_code,
        render_payload_snapshot: d.render_payload_snapshot ? "<present>" : null,
      })),
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
