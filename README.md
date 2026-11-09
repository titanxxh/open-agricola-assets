# Open Agricola Assets

Current-only static image source for Open Agricola.

Live site: https://titanxxh.github.io/open-agricola-assets/

See [NOTICE](NOTICE) for artwork attribution, the fan-project disclaimer, and the
font license, and [LICENSE](LICENSE) for the terms that apply to each part of this
repository. The reproduced Agricola artwork is **not** licensed by this project and
may only be used for the non-commercial fan project.

## Classic card artwork

The 1,024 classic card faces are stored under `assets/classic/<deck>/<original-code>.png`.
The deck directories are `BI`, `C`, `E`, `FL`, `FR`, `G`, `I`, `K`, `NL`, `O`,
`PI`, `WA`, `WM`, and `Z`. Original filenames and PNG bytes are preserved from
the `agricolaoldnice` source used by the main repository's classic-card import.
Card identities and source provenance are recorded in the main repository's
`reference/classic/source-cards.json` and `docs/classic/migration-manifest.json`.

The main application consumes these images through its pinned public asset
contract; they are not bundled in the application repository. Publish this
repository before updating that application's `public-assets.ref` and
`public-assets.required.json`.

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
