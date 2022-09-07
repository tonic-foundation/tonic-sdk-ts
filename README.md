# Tonic SDK

Typescript client library for [Tonic](https://tonic.foundation). See the [API Reference](https://docs.tonic.foundation/developers/api-reference) for more details.

## Developing

```
yarn
yarn build:all
```

## Building in Docker

It's recommended to run this before attempting to cut a new release. Differences
in dev environment may cause build to fail in CI which build without issue on
your machine.

```
docker buildx build .
```

## Publishing

- Update package.json.

```
yarn version all <major|minor|patch>

# or
yarn version all 0.0.1
```

- Commit the new release and push to master.
- Cut a new release from master. Github Actions will publish it automatically.
