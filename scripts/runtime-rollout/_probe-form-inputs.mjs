import dotenv from "dotenv";
dotenv.config({ path: ".env.e2e.local", override: false });

const API = "http://localhost:3001/api/v1";

async function login() {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  console.log("Login status:", r.status);
  const sc = r.headers.getSetCookie();
  let token = null;
  for (const v of sc) {
    const m = String(v).match(/qlv_session=([^;]+)/);
    if (m) { token = m[1]; break; }
  }
  console.log("Token:", token ? token.slice(0, 10) + "..." : null);
  if (!token) console.log(await r.text());
  return token;
}

async function putInputs(token, docId, body) {
  const r = await fetch(`${API}/documents/generated/${docId}/form-inputs`, {
    method: "PUT",
    headers: { "content-type": "application/json", cookie: "qlv_session=" + token, "x-qllaw-fixture-ownership": "probe" },
    body: JSON.stringify(body),
  });
  console.log("PUT status:", r.status);
  const text = await r.text();
  console.log("PUT body:", text.slice(0, 2000));
  return { status: r.status, body: text };
}

async function getInputs(token, docId) {
  const r = await fetch(`${API}/documents/generated/${docId}/form-inputs`, {
    method: "GET",
    headers: { cookie: "qlv_session=" + token },
  });
  console.log("GET status:", r.status);
  const text = await r.text();
  console.log("GET body:", text.slice(0, 1000));
  return { status: r.status, body: text };
}

async function main() {
  const token = await login();
  if (!token) return;
  console.log("\n--- GET existing inputs ---");
  await getInputs(token, "148");
  console.log("\n--- PUT minimal R1 ---");
  await putInputs(token, "148", {
    formInputs: { decisionNumber: "01/QD-BM-058-R1-test" },
    updatedByName: "probe",
  });
  console.log("\n--- GET after PUT ---");
  await getInputs(token, "148");
}

main().catch(console.error);
