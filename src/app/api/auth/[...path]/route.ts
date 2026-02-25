import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

async function proxy(
  req: NextRequest,
  path: string[],
) {
  const url = `${BACKEND}/auth/${path.join("/")}`;

  const res = await fetch(url, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: await req.text() }
      : {}),
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxy(req, (await params).path);
}
