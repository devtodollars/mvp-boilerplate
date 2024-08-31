---
sidebar_position: 3
---
# Release (Github Actions)

## Setup

Below are the steps to configure the [pipelines](https://github.com/devtodollars/flutter-supabase-production-template/tree/main/.github/workflows) to create a deployment preview, deploy Supabase edge functions, and create / publish releases.

1. Create a Netlify site: Add New Site > Manual Deploy
2. Upload below .zip file to create the website

[Download web.zip](../assets/web.zip)

3. (OPTIONAL) [Configure a custom domain](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/#configure-a-subdomain) in Netlify

:::info
You'd preferably configure a subdomain (e.g. `app.devtodollars.com`)
:::

4. Go to page to set [Github Action secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)
5. Create the following secrets:
   1. `NETLIFY_AUTH_TOKEN`: Follow these [steps](https://docs.netlify.com/cli/get-started/#obtain-a-token-in-the-netlify-ui) to obtain auth token
   2. `NETLIFY_SITE_ID`: Site Configuration > Site details > Site Id
   3. `SUPABASE_PROJECT_ID`: Project Settings > General Settings > Reference ID
   4. `SUPABASE_ACCESS_TOKEN`: Create one [here](https://supabase.com/dashboard/account/tokens)



## Release Process

For the release process we use [semantic versioning](https://semver.org/) and tags for releases. Also, see [trunk based development](https://trunkbaseddevelopment.com/) to see&#x20;

1. Checkout a new branch in the format (e.g. 1.2.3)

```bash
git checkout -b version-1.2.3
```

2. Run the [bumpversion.sh](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/flutter/bumpversion.sh) script and specify the version number

```bash
./bumpversion.sh 1.2.3
```

:::info
You may need to run `chmod +x ./bumpversion.sh` to be able to run the bumpversion script. Also this script runs translations so openai costs
:::

3. Push the new commit created by the `bumpversion.sh` script and tags to the repository.

```bash
git push
git push --tags
```

4. Wait for the build to finish running, and a deploy preview should be created. You can test if your flutter changes work.

:::info
If you made backend changes, they won't be reflected unless you [push local changes to prod env](../supabase/local-development/pull-changes.md#pushing-local-changes-to-prod-env) and/or [deploy the supabase edge functions](../supabase/common-commands.md#deploy-supabase-functions)
:::

4. Update the [release draft notes](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository#editing-a-release) with the changes you made
5. Publish the release and set it as latest

:::warning
When you publish the release, it'll run a pipeline which will deploy the supabase edge functions & set
:::
