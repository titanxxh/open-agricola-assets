# Open Agricola Assets

Current-only static image source for Open Agricola.

Live site: https://titanxxh.github.io/open-agricola-assets/

## Update and publish

1. Update the current files under `assets/`. Do not add version directories or old copies.
2. Commit the change, then run `git pull --rebase origin main`.
3. Push `main`.
4. Wait for the `Deploy assets to GitHub Pages` workflow to succeed.
5. Only then update `public-assets.ref` in `titanxxh/open-agricola`.

The workflow generates `asset-version.txt` and `asset-manifest.json` from the deployed commit without committing them. It then downloads and byte-checks every live manifest entry against the same checkout.

To repeat the live check locally:

```bash
node scripts/assets.mjs verify https://titanxxh.github.io/open-agricola-assets/ "$(git rev-parse HEAD)"
```
