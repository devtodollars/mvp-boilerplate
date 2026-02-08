import { User } from "supabase";
import { supabase } from "./supabase.ts";

async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }
  const token = authHeader.replace("Bearer ", "");

  // Debug logging
  console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL") ? "set" : "NOT SET");
  console.log("SERVICE_ROLE_KEY:", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "set" : "NOT SET");

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    console.error("Auth error:", error.message);
    throw error;
  }
  const user = data?.user;
  return user;
}

// handles cors and returns the user if function called from client
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function corsResponse(res: Response): Response {
  const newHeaders = new Headers(res.headers);

  // Apply CORS headers, ensuring they take precedence
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  const newRes = new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });

  return newRes;
}

export function resFromError(e: { message?: string }): Response {
  return new Response(JSON.stringify({ message: e?.message }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export function clientRequestHandlerWithUser(
  handler: (req: Request, user: User) => Promise<Response> | Response,
) {
  const enhancedHandler = async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const user = await getUserFromRequest(req);
      if (!user) throw Error("Authentication Error");
      return corsResponse(await handler(req, user));
    } catch (e) {
      console.error(e);
      return resFromError(e);
    }
  };
  Deno.serve(enhancedHandler);
}

export function clientRequestHandler(
  handler: (req: Request) => Promise<Response> | Response,
) {
  const enhancedHandler = async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const res = await handler(req);
      return corsResponse(res);
    } catch (e) {
      console.error(e);
      return resFromError(e);
    }
  };
  Deno.serve(enhancedHandler);
}
