import { getAuth } from "@/lib/auth/server";

type AuthRouteContext = { params: Promise<{ path: string[] }> };
type AuthMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function createHandler(method: AuthMethod) {
  return (request: Request, context: AuthRouteContext): Promise<Response> =>
    getAuth().handler()[method](request, context);
}

export const GET = createHandler("GET");
export const POST = createHandler("POST");
export const PUT = createHandler("PUT");
export const DELETE = createHandler("DELETE");
export const PATCH = createHandler("PATCH");
