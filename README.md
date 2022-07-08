# Tonic SDK 

Typescript client library for [Tonic](https://tonic.foundation). See the [API Reference](https://docs.tonic.foundation/developers/api-reference) for more details.

## Developing

```
yarn
yarn build:all
```

## Building in Docker

```
docker buildx build .
```

## Publishing

```
yarn version:all <major|minor|patch>
yarn build:all
npm publish --access restricted --workspaces
```
