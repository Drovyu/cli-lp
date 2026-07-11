# Drovyu Preview CLI landing page

Static Astro site for the Drovyu Preview CLI landing page, documentation, and help center.

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

Promote a tested revision to production by merging `main` into `release`. Do not commit generated `dist` files.

## Public statistics

The landing page reads aggregate service statistics from:

```text
https://stats.preview.drovyu.com/stats.json
```

The Preview Worker refreshes this object hourly in a dedicated public R2 bucket. The object contains aggregate counts only and does not contain preview ids, device ids, URLs, storage keys, filenames, or decryption keys.

## License

The repository is public for transparency and review. It is source-available, not open source. See [LICENSE](LICENSE).
