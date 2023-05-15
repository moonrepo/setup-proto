# Setup and install the proto toolchain

A GitHub action that sets up an environment for proto by...

Installing the `proto` binary globally using the
[official installation script](https://moonrepo.dev/docs/proto/install), and appending the
installation directory to `PATH`.

And also caching the toolchain `~/.proto`, keyed by hashing the `.prototools` configuration file
found in the workspace root.

## Installation

```yaml
# ...
jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: moonrepo/setup-proto@v0
      - run: proto use
```

## Inputs

- `version` - Version of proto to explicitly install. Defaults to "latest".
