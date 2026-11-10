# End-to-end tests

Run with Playwright (`dev` server on port 3000 is reused when already running):

```
pnpm exec playwright test --project=chromium
```

## Visual baselines (`chart.spec.ts-snapshots/`)

Screenshot baselines are named by browser and OS, e.g.
`Chart-Plot-with-BollingerBands-Dark-chromium-win32.png`.

- `-win32.png`: captured on Windows (the maintainer's machine). Used when running on Windows.
- `-linux.png` (e.g. `firefox-linux`, `msedge-linux`, `webkit-linux`): captured on Linux. Used there.

A baseline only matches the platform it was captured on (font and anti-aliasing differ),
so a Windows baseline is not valid on Linux and vice versa. When the chart rendering
changes on purpose, regenerate the baseline for the affected project only:

```
pnpm exec playwright test e2e/chart.spec.ts --project=<browser> -g "Plot configurator" --update-snapshots
```

Review the regenerated PNGs before committing them.

## Locale

Tests run with `en-US` (see `playwright.config.ts`). Edge takes its number-format default
from the OS, so `--lang=en-US` is passed to the `msedge` project. Without it, values such as
`8070.5` render as `8070,5` and assertions fail.
