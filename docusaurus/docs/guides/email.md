---
sidebar_position: 5
---
# Email (Postmark)

## Setup

1. Buy a domain, I recommend [Cloudflare](https://developers.cloudflare.com/registrar/get-started/register-domain/)
2. Create a postmark account and follow these [instructions](https://postmarkapp.com/support/article/1002-getting-started-with-postmark)
3. On the banner click "Request Access" and fill in the form to [get your account approved ](https://postmarkapp.com/support/article/1084-how-does-the-account-approval-process-work)
4. Create [email templates](https://postmarkapp.com/support/article/786-using-a-postmark-starter-template) within postmark for transactional emails. For example, a welcome email or an email to send after a user subscribes.
5. Wait for approval. Then proceed to the next steps.
6. Update the `sendEmail` functions [on user creation](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/supabase/functions/on\_user\_modify/index.ts#L19) and when a [user subscribes](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/supabase/functions/stripe\_webhook/index.ts#L111)

:::info
Make sure to update your `supabase/.env` file and [deploy your secrets](backend/common-commands.md#set-supabase-secrets-from-.env-file)
:::

7. (OPTIONAL) [Update Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp) to point to Postmark.



