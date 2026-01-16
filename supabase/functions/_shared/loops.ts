import { LoopsClient } from "loops";

const loops = new LoopsClient(Deno.env.get("LOOPS_API_KEY")!);

type DataVariables = Record<string, string | number | boolean>;

export async function sendWelcomeEmail(
  email: string,
  dataVariables: DataVariables = {},
) {
  return loops.sendTransactionalEmail({
    email,
    transactionalId: Deno.env.get("LOOPS_WELCOME_TEMPLATE_ID") || "welcome",
    dataVariables,
  });
}

export async function sendTransactionalEmail(
  email: string,
  transactionalId: string,
  dataVariables: DataVariables = {},
) {
  return loops.sendTransactionalEmail({
    email,
    transactionalId,
    dataVariables,
  });
}

export { loops };
