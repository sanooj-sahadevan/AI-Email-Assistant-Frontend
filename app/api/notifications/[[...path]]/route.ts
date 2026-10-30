import { proxyBackendRequest } from "../../../lib/backend-proxy";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const subpath = path && path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : "";
  return proxyBackendRequest(request, `notifications${subpath}`);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
