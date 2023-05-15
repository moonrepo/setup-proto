# moon - Setup the proto toolchain manager

A GitHub action that sets up an environment for moon by...

Installing the `proto` binary globally using the
[official installation script](https://moonrepo.dev/docs/proto/install), and
appending the installation directory to `PATH`.

And also caching the toolchain `~/.proto`, keyed by hashing the `.prototools`
configuration file found in the repository.

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
      - uses: moonrepo/setup-proto-action@v1
      - run: proto use
```

## Inputs

- `version` - Version of moon to explicitly install. Defaults to "latest".
