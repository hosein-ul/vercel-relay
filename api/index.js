export const config = { runtime: "edge" };

const TARGET = (process.env.TARGET_DOMAIN || "").replace(/\/+$/, "");

const HOP = new Set([
  "connection","keep-alive","transfer-encoding","te","upgrade",
  "proxy-authorization","proxy-authenticate","trailer",
  "x-vercel-id","x-vercel-cache","x-vercel-deployment-url",
  "x-forwarded-host","x-forwarded-proto","x-forwarded-port",
]);

export default async function handler(req) {
  if (!TARGET) return new Response("TARGET_DOMAIN not set", { status: 500 });
  const path = req.url.slice(req.url.indexOf("/", 8));
  const headers = new Headers();
  for (const [k, v] of req.headers) {
    if (!HOP.has(k.toLowerCase())) headers.set(k, v);
  }
  const xff = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for");
  if (xff) headers.set("x-forwarded-for", xff);
  const up = await fetch(TARGET + path, {
    method: req.method, headers, body: req.body, duplex: "half", redirect: "manual",
  });
  const rh = new Headers();
  for (const [k, v] of up.headers) {
    if (!HOP.has(k.toLowerCase())) rh.set(k, v);
  }
  return new Response(up.body, { status: up.status, headers: rh });
}
