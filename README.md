# Componer

A components development workflow framework dependented on gulp

## Install and initialize

```
npm install -g componer
mkdir test-project
cd test-project
componer init -i
```

## Usage

Componer is a workflow framework, so you can use it to finish your work automaticly.

#### Workflow

**ls**

List components in your `components` directory.

```
componer ls
```

**add**

Add a component, e.g. bower component, npm package, frontend component.

```
componer add component-name -t bower -a your-github-name
```

`-t` is `--type`, relates to directories in `gulp/snippets`.

**build**

Build a component source code from it's `src` directory to `dist` directory.

```
componer build component-name
```

When build, Componer will compile your ES6 code to ES5 code and pack your code into a file by webpack. 
At the some time, scss files will be compiled to css files, minified by cssmin, and be put in `dist` directory.

**preview**

Preview a component if it has a `preview/index.html` file.

```
componer preview component-name
```

When preview a component, it will firstly build it and then setup a local static webserver ([ts-server](https://github.com/tangshuang/ts-server), which is also written following Componer).

**watch**

When you are coding, you can run a watch task to build your code automaticly after you change your code and save the changes.

```
componer watch component-name
```

**test**

Before you publish your component, a unit test is needed. Run:

```
componer test component-name
```

`test/specs/index.js` will be the entry file, and reporters will be put in `test/reporters`.

**remove**

You may want to remove your code, run:

```
componer rm component-name
```

#### Component types

I support these types: package, bower, default

**How to add your custom type?**

1/ create a directory in `gulp/snippets`

2/ create files in this dir

3/ when you run `add` task, add a `--type=typename`, typename is the directory name you have created

#### Component Directory Structure

```
components/component-name
	|
	|--src
	|  `--js
	|  |  `--component-name.js
	|  |  |--..
	|  |--style
	|  |--img
	|  |--fonts
	|--dist
	|  `--js
	|  |--css
	|  |--img
	|  |--fonts
	|--test
	|--preview
	|--README.md
	|--...
```

In fact, your coding workspace is in components direcotry.

## Component Spec



**componer.json**

When you use componer to add a default component, you will get a componer.json under your new component directory. The structure of componer.json is :

```
{
    "name": "component-name", // your component name
    "entry": { 
        // which is the entry file to be pack with by webpack
        // if there is no js or style entry file, js or style will not be build, but you can follow webpack to require(css) in entry js file
        "js": "src/js/component-name.js",
        "style": "src/style/component-name.scss",
        "copy": "src/fonts" // copy means copy this files to dist directory, relative path
    },
    "output": {
        // which directory to put built files
        "js": "dist/js/",
        "style": "dist/css/"
    },
    "settings": { // settings will be merged with webpack configuration
        "externals": {},
        "resolve": {
            "packageAlias": "bowerComponents",
            "alias": {}
        }
    }
}
```

componer.json is useful for webpack to build codes. It tells wepack which files to enter, and which directories to put built files. Settings will be mereged to pass to webpack.

## Componer CLI

Componer provide a cli command tool:

```
npm install -g componer
componer --help
```

You can read all from help document.

And event you can develop your custom cli command. You should know `commander` firstly, then code in `./bin/custom-cli.js`. Do it!

## Development

If you want to contribute to this project, follow rules:

1/ just coding in `gulp` direcotry and gulp.babel.js

2/ code style

3/ use ES6

4/ less dependencies