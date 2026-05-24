# Hosting

The project is Vercel-compatible and also works on static hosts after build.

## Vercel

Upload the ZIP that contains this top-level structure:

```text
app/
contracts/
script/
SPEND_AND_SAVE_FIRST_CIRCLE.md
DEPLOY_WITH_REMIX.md
HOSTING.md
README.md
foundry.toml
package.json
vercel.json
.gitignore
```

Vercel settings:

- Build command: `npm run build`
- Output directory: `dist`

Environment variables:

```bash
NEXT_PUBLIC_DEFAULT_SAVINGS_VAULT=0xYourSavingsVaultAddress
NEXT_PUBLIC_SPEND_SAVE_CONTRACT=0xYourDeployedSpendAndSaveContract
```

## Static Hosting

For Netlify, cPanel, Cloudflare Pages, GitHub Pages, or any static host:

1. Run `npm run build`.
2. Upload the contents of `dist/`.
3. If your host does not use environment variables, edit `dist/config.js`:

```js
window.SPEND_SAVE_CONFIG = {
  defaultSavingsVault: "0xYourSavingsVaultAddress",
  spendSaveContract: "0xYourDeployedSpendAndSaveContract"
};
```

## Local Preview

```bash
npm run dev
```

Open `http://localhost:3000`.
