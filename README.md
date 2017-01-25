# RightScale Frontend build tools

Node module that dynamically generates a set of Gulp tasks based on a given configuration object in order to build a front-end project (library or application).

The tasks target a TypeScript project and SCSS style sheets. Optionally supporting Angular 1.x templates.

## Concepts

The build tools rely on conventions over configuration as much as possible. This way, all projects should be organized in a similar manner and be easier for team members to navigate.

The basic unit is a bundle. A bundle here is a set of assets such as code, styles and images that are transformed together. A project should have at least one bundle but may have more.

A bundle can depend on other bundles and they will be built in order.

The build tools will automatically generate a set of Gulp tasks for each bundle and set their dependencies according to the bundles dependency tree.

## Conventions

Bundles are organized in a standard manner, the presence of their various components is automatically detected and the corresponding Gulp tasks are created.

- bundle root folder
  - `index.ts`: code entry point
  - `index.scss`: styles entry point
  - `spec.ts`: unit tests entry point
  - `**/*.svg`: images to pre-cache in Angular
  - `**/*.html`: Angular templates to pre-cache

## Installation

Install the build tools and Gulp in your project:

    npm i --save-dev gulp @rightscale/ui-build-tools

However, you should use the RightScale project templates to generate a project as they will set up everything for you:

- [Application templates](https://github.com/rightscale/scfld-rs-app)
- [Library template](https://github.com/rightscale/scfld-rs-library)

## Configuring your project

Create `gulpfile.js` at the root of your project to configure the build tools. A simple configuration would look like this:

    var build = require('@rightscale/ui-build-tools');

    build.init({
      bundles: [{
        name: 'app',
        root: 'src'
      }]
    });

## Options

Here's the schema of the options, in TypeScript style:

    {
      minify: boolean; // default: true, whether to minify JavaScript code
      bundles: {
        name: string;
        dependencies: string[]; // names of other bundles
        root: string;           // folder name containing the bundle
        dist: boolean;          // whether to output the results to the dist folder instead of the build folder
        angular: boolean;       // default: true, determines if HTML and SVG files should be bundle in Angular pre-cached files
        library: boolean;       // set to true if your bundle is a library
      }[],
      run: {  // configure to run a bundle as a web app
        bundle: string; // name of the bundle to run
        port: number;   // default: 3000
        host: string;   // default: localhost
        environments: { // defines environments to proxy API calls to
          [name: string]: { // environment name
            [path: string]: string  // relative path to url proxy definitions 
          }
        }
      }
    }

## The generated tasks

The tasks generated depend on the configuration and the files found in the bundle. For example, without `spec.ts` no test tasks will be created.

Most tasks are prefixed with the bundle name. In the examples below, we'll assume that name is `app`.

You can run `gulp --tasks` to view the tasks generated for your project.

### Building

Building an app involves the following:

- Compiling TypeScript code and bundling it into a single JavaScript file, using Rollup.
- Compiling SCSS styles into a single CSS file.
- Pre-caching Angular templates into a JavaScript file (to be imported by the TypeScript code).
- Pre-caching SVG images into a JavaScript file (to be imported by the TypeScript code).
- copying non `.ts` and non `.scss` files from the root of the bundle. 

All generated files are placed in the `build` folder. If the `dist` flag is set on your bundle, then the files are instead placed into the `dist` folder except for the templates and images pre-cache files.

You can build your bundle using:

    gulp app:build

### Testing

A number of tasks are created to test your code using Karma with different browsers. For quick tests and CI systems, you can use PhantomJS:

    gulp app:spec

But you can also specify a browser:

    gulp app:spec:chrome

Or run the tests in all browsers supported on your platform:

    gulp app:spec:windows
    gulp app:spec:linux

You can also debug your specs in the browser, for example:

    gulp app:spec:firefox:debug

### Running

You may want to run your app using a local server. This is made possible using BrowserSync. By default, your bundle's name is used as task name to run it:

    gulp app

But if you specify environments in your configuration, then the environments names will be used instead.

Your code files will be monitored and any change will trigger a rebuild. BrowserSync will auto reload the page on changes.

### Other

You can remove the generated files by running:

    gulp clean
