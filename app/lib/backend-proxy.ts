export async function proxyBackendRequest(
  request: Request,
  backendPath: string,
): Promise<Response> {
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return Response.json({ message: "Backend API URL is not configured." }, { status: 503 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`${backendUrl}/${backendPath}`);
  targetUrl.search = incomingUrl.search;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      ...(request.method === "GET" || request.method === "HEAD"
        ? {}
        : { body: await request.arrayBuffer() }),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    const responseHeaders = new Headers();
    for (const name of ["content-type", "location", "set-cookie"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set("cache-control", "no-store");
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ message: "The backend could not be reached." }, { status: 503 });
  }
}
