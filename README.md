# Increment CalVer version based on latest release action

This action gets the apps affected by the changes since the last successful build and sets them as outputs.

## Inputs

### `repo`

The report to check for releases (Defaults to environment variable: `GITHUB_REPOSITORY`).
Example: `onward-partners/increment-calver-action`

### `tag-prefix`

The prefix that might be in front of the version. Example: `v`

### `cycle`

**Required** The release cycle. Possible values: `auto`, `year`, `month`, `week`, `day`.

### `github-token`

**Required if repo is private** Your GitHub access token (see Usage below).

## Outputs

### `new-version`

The version after the increment (including prefix)

### `new-version-clean`

The version after the increment (without prefix)

### `current-version`

The version before the increment (including prefix)

### `current-version-clean`

The version before the increment (without prefix)

## Example usage

```yaml
on:
  workflow_dispatch:
    inputs:
      type:
        description: 'Release cycle'
        required: true
        default: 'auto'
        type: choice
        options:
          - auto
          - year
          - month
          - week
          - day

jobs:
  increment-version:
    runs-on: ubuntu-latest
    name: Get affected apps
    outputs:
      new-version: ${{ steps.version_increment.outputs.new-version }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: onward-partners/increment-calver-action@v1
        id: increment-version
        with:
          cycle: week
          github_token: ${{ secrets.GITHUB_TOKEN }}
  app-a:
    runs-on: ubuntu-latest
    name: build app a
    needs: increment-version
    steps:
      - name: Update version in source
        run: <DO THE UPDATE HERE> ${{ needs.increment-version.output.new-ersion }}
```
