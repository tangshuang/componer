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

## Component Spec

1. package

A npm package which runs in node environment is usually follows `CommonJS` modules spec. So, when you run a `gulp add` task with `--type=package`, you can find the new package contains a component named js file in src directory.

You can `require` or `import` in this js files, after you run `gulp build` task, the package codes will build by babel, and all built files will lay in `dist`. In fact, the built files follow CommonJS also, this is the reason why all files in `dist` like copied from `src`.

2. bower

A bower component is different from a npm package, a bower component is always used in brower side. In browser client environment, no original modules is provided, so `UMD` is used to adapt to client side environment.

You can code in src directory following CommonJS/ES6 Modules. After your coding, webpack will pack all js codes beginning with `src/js/component-name.js`, this file is the entry file.

What to do with dependences? For example, your component is dependented on jquery, what should you do?

There are two choice: 1. pack jquery in component, so that uses can use the component anywhere, 2. do not pack in, but record as a dependence. Componer choosed the second rule. Because we have `require.js` in frontend. Now what should you do? 

Just put jquery in dependences in `bower.json` as bower always do.

Componer use sass to build css, `src/style/component-name.scss` is the entry file. Notice that, all images and fonts will **not** be packed in the final css! Because we always want to use a image from a static server by url. So absolute url is recommended.

3. normal component

A normal component is a component without any another dependences. It works everywhere, provide apis. So in fact, a normal component is a project which works for one thing.

So at last, the component will be build into a file to contains all it needs.

## Development

If you want to contribute to this project, follow rules:

1/ just coding in `gulp` direcotry and gulp.babel.js

2/ code style

3/ use ES6

4/ less dependences