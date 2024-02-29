import { User } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { supabase } from "./supabase.ts";

async function getUserFromRequest(req: Request) {
  const token = req.headers.get("Authorization")!.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  const user = data?.user;
  return user;
}

// handles cors and returns the user if function called from client
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function resFromError(e: { message?: string }): Response {
  return new Response(
    JSON.stringify({ message: e?.message }),
    {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}

export function clientRequestHandler(
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
      return await handler(req, user);
    } catch (e) {
      console.error(e);
      return resFromError(e);
    }
  };
  Deno.serve(enhancedHandler);
}
