import { dispatchApi } from "@/server/api/dispatch";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return dispatchApi(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
