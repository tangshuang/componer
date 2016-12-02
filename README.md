# Componer

A components development workflow framework dependented on gulp

## Install

```
npm install -g gulp-cli

git clone https://github.com/tangshuang/componer.git
cd componer
npm install


gulp build preview ---name=browser-logger
```

`browser-logger` is a defualt type component I have created by componer.

## Usage

Componer is a workflow framework, so you can use it to finish your work automaticly.

#### Workflow

**ls**

List components in your `components` directory.

```
gulp ls
```

**add**

Add a component, e.g. jquery plugin, npm package, frontend component.

```
gulp add --name=component-name [--type=package|bower|jq-plugin] [--author=your-name]
```

`type` relates to directories in `gulp/snippets`.

**build**

Build a component source code from it's `src` directory to `dist` directory.

```
gulp build --name=component-name
```

When build, Componer will compile your ES6 code to ES5 code and pack your code into a file by webpack, entry file is `src/js/index.js`, minified by uglify, dest to `dist/js/`. At the some time, scss files in `src/style/` will be compiled to css files, minified by cssmin, and be put in `dist/css/`, images in `src/img/` and font files in `src/fonts` will be copied to `dist` directory.

**preview**

Preview a component if it has a `preview/index.html` file.

```
gulp preview --name=component-name
```

When preview a component, it will firstly build it and then setup a local static webserver ([ts-server](https://github.com/tangshuang/ts-server), which is also written following Componer).

**watch**

When you are coding, you can run a watch task to build your code automaticly after you change your code and save the changes.

```
gulp watch --name=component-name
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
	|  |  `--index.js/component-name.js
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

## Development

If you want to contribute to this project, follow rules:

1/ just coding in `gulp` direcotry and gulp.babel.js

2/ code style

3/ use ES6

4/ less dependences