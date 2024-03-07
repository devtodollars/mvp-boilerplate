type SendEmailProps = {
  to: string;
  template: string;
  templateModel?: object;
  messageStream?: string;
};
type SendEmailPostmarkProps = {
  From: string;
  To: string;
  TemplateAlias: string;
  TemplateModel: object;
  MessageStream?: string;
};

async function sendEmailPostmark(props: SendEmailPostmarkProps) {
  const url = "https://api.postmarkapp.com/email/withTemplate";
  const headers = new Headers({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Postmark-Server-Token": Deno.env.get("POSTMARK_SERVER_TOKEN") || "",
  });

  const reqBody = JSON.stringify(props);
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: reqBody,
  });
  return await response.json();
}

export async function sendEmail(
  { to, template, templateModel = {}, messageStream = "outbound" }:
    SendEmailProps,
) {
  const From: string = Deno.env.get("POSTMARK_FROM_EMAIL") || "";
  return await sendEmailPostmark({
    From,
    To: to,
    TemplateAlias: template,
    TemplateModel: templateModel,
    MessageStream: messageStream,
  });
}
