# Drovyu Preview CLI landing page

Static Astro site for the Drovyu Preview CLI landing page, documentation, and help center.

Public information pages include `/security`, `/trust`, `/about`, `/privacy`, `/terms`, and `/contact`. Live service status is published at <https://status.drovyu.com>.

- Production: <https://cli.drovyu.com>
- Preview service: <https://preview.drovyu.com>
- Public CLI source: <https://github.com/Drovyu/preview-cli>

## Development

The pinned runtime is managed by mise.

```sh
mise install
mise exec -- npm ci
mise exec -- npm run dev
```

Run the production build before opening a pull request:

```sh
mise exec -- npm run build
```

## Deployment

Cloudflare Pages is connected to this repository.

- `main` is the development branch and creates a preview deployment.
- Pull requests create preview deployments.
- `release` is the production branch and deploys to `cli.drovyu.com`.

Cloudflare Pages build settings:

```text
Production branch: release
Build command: npm run build
Build output directory: dist
NODE_VERSION: 26.5.0
```

Promote a tested revision to production by merging `main` into `release`. Do not commit generated `dist` files.

## Contact form

`/contact` posts to the Cloudflare Pages Function at `/api/contact`. The function verifies Cloudflare Turnstile and forwards validated submissions to a Discord webhook. Configure these encrypted values for both preview and production deployments:

```text
TURNSTILE_SECRET_KEY            Encrypted Pages secret
DISCORD_CONTACT_WEBHOOK_URL     Encrypted Pages secret
```

The public Turnstile site key is embedded in the contact page. Never put the Turnstile secret or Discord webhook URL in source files, build variables, or GitHub secrets used by client-side code. The endpoint also enforces same-origin requests, input and body-size limits, a honeypot field, and disables Discord mentions.

## Browser trial

The landing-page trial uses the dedicated `/api/trials` Worker API. It encrypts files and the manifest in the browser, requires explicit confirmation before creating an upload, and accepts the same extension allowlist as the CLI. Trials are limited to 10 MiB, 100 files, one active preview per browser, and a fixed 24-hour lifetime. Trial previews cannot be updated, extended, or manually deleted.

## Public statistics

The landing page reads aggregate service statistics from:

```text
https://stats.preview.drovyu.com/stats.json
```

The Preview Worker refreshes this object hourly in a dedicated public R2 bucket. The object contains aggregate counts only and does not contain preview ids, device ids, URLs, storage keys, filenames, or decryption keys.

## License

The repository is public for transparency and review. It is source-available, not open source. See [LICENSE](LICENSE).
