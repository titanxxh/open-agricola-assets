# Open Agricola Assets

Current-only static image source for Open Agricola.

Live site: https://titanxxh.github.io/open-agricola-assets/

See [NOTICE](NOTICE) for artwork attribution, the fan-project disclaimer, and the
font license, and [LICENSE](LICENSE) for the terms that apply to each part of this
repository. The reproduced Agricola artwork is **not** licensed by this project and
may only be used for the non-commercial fan project.

## Classic card artwork

The 1,024 classic card faces are stored under `assets/classic/<deck>/<code>.png`.
Classic deck IDs prepend `C` to the original deck; numbers have three digits.
The directories are `CBI`, `CC`, `CE`, `CFL`, `CFR`, `CG`, `CI`, `CK`, `CNL`,
`CO`, `CPI`, `CWA`, `CWM`, and `CZ`. For example, `E11.png` becomes
`assets/classic/CE/CE011.png`, `WM001.png` becomes
`assets/classic/CWM/CWM001.png`, and `C01.png` becomes
`assets/classic/CC/CC001.png`.

The PNG bytes from `agricolaoldnice` are unchanged.
[`classic-card-sources.json`](classic-card-sources.json) records every original
filename, previous repository path, new path, and SHA-256. It provides the
mapping for the application's classic-card importer and source manifest.

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

The workflow generates three files from the deployed commit:

- `asset-version.txt` contains the commit SHA.
- `asset-manifest.json` contains that SHA as `version` and the sorted path list as `files`.
- `asset-digests.json` contains the same `version` and a `digests` object. It maps
  every path in `files`, including its `assets/` prefix, to the lowercase
  hexadecimal SHA-256 of the published bytes.

These files are generated in `dist/`. The live check verifies version and path
coverage. For each downloaded asset, it compares the bytes with the checkout
and the SHA-256 with `asset-digests.json`.

To repeat the live check locally:

```bash
node scripts/assets.mjs verify https://titanxxh.github.io/open-agricola-assets/ "$(git rev-parse HEAD)"
```
