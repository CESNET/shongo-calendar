# ShongoCalendar

Shongo Calendar is a library built on top of [Angular Calendar](https://github.com/mattlewis92/angular-calendar) by Matt Lewis. The library is an extension for purposes of the Shongo reservation system.

## Requirements

- Node ^16.14.0 || ^18.10.0
- Npm

## Set-up

- Install dependencies by running `npm install`.
- Now you can run the Demo application with `npm start`.

## Installation

- This library is published on GitHub npm registry, to access it, add this line to your `.npmrc` file at the root of the project: `@cesnet:registry=https://npm.pkg.github.com`
- You can add this library as a dependency to your project, by running `npm install @cesnet/shongo-calendar`.
- You might be required to log-in to GitHub npm, see [Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

## Build

- Build the library by using the `npm run build:lib` command.
- The output will be placed into `/dist` folder.

## Release

- The library is released via GitHub releases.
- Create a new release with a new tag and the description of the release.
- The major version of the library should always be >= to the compatible version of Angular.
- Creating the release will automatically run GitHub Action that builds and published the package.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.
