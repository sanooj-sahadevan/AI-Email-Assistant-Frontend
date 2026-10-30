import { proxyBackendRequest } from "../../../lib/backend-proxy";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const subpath = path?.length ? `/${path.map(encodeURIComponent).join("/")}` : "";
  return proxyBackendRequest(request, `ai${subpath}`);
}

export const POST = forward;
