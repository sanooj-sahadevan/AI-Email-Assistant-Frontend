import { proxyBackendRequest } from "../../../lib/backend-proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyBackendRequest(request, `gmail/${path.map(encodeURIComponent).join("/")}`);
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
