# Componer

Componer is a workflow tool to help frontend developers to coding more easily.
Support ES6. On the shoulders of gulp, bower, webpack, karma, jasmine and so on.

## Install and initialize

Componer is based on `gulp` and `bower`, so you should install them globally first.

```
npm install -g bower
npm install -g gulp-cli
npm install -g componer

mkdir test-project
cd test-project
componer init
npm install
```

## Usage

```
componer -v
componer -h
componer init
componer add name [-t bower -a yourname]
componer build [name]
componer watch [name]
componer preview name
componer test [name] [-D] [-b Chrome]
componer remove/rm name
componer list/ls

componer clone name

componer install [name]
componer link [name]
```

### init [-I|--install]

After your `npm install -g componer`, you should create a empty directory, and enter it to run `componer init`. Then you will see different files be initialized into this directory.

This directory is called `componer` directory.

When you run `componer init`, it will ask you two questions: your github name and the package name. The value you typed in will be found in `package.json`. So you can modify the file later.
Your github name is important, because it will be used when you run `componer add`. If you do not give a `--author` parameter when you run `componer add` task, componer will use your github name to create the package github registry address.

If you give a `-I` option, `npm install` will be run after init.

### reset [-I|--install]

Copy componer gulp directory/gupfile.babel.js to exists project directory.

**Notice**: project files relative with gulp with be rewrited.

### add <name> [-t|--type component] [-a|--author your-name]

Add a componout. A `componout` is a production created by componer.

Componout name should must be given.

When you run `componer add` task, you can pass `-t` and `-a` parameters. `-t` is short for `--type`, if you run `componer add my-test -t npm`, my-test componout will be a npm package. Default types are directory names in `gulp/templates`.

If it runs successfully, you will find a new dirctory in componouts directory.

If you want to add a new type of componout, just create a new dirctory in your gulp/templates directory. Type name is the directory name. In template file, you can use `{{component-name}}` as string template.

`defaults` options in `.componerrc` in your project root path will be used as default values if you not give a -t or -a option.

### build [name]

When you run build task, componer will compile your ES6 code to ES5 code and combine your code into one file by webpack.

At the same time, scss files will be compiled to css files, minified by cssmin, and be put in `dist` directory too.

However, `componer.config.js` is a special file which has information used for compiling.

```
build: [
	{
		from: "src/script/bar-chart.js", // entry file to build with
		to: "dist/js/bar-chart.js", // output file after be built
		driver: "webpack", // driver to use, only webpack supported for javascript
		options: { // minify and sourcemap options
			minify: true,
			sourcemap: "file", // true (same as "file"), "inline"
			before: function(settings) {}, // execute before build
			after: function() {}, // execute after build finished
		},
		settings: {}, // settings passed to webpack, look into webpack config
	},
	{
		from: "src/style/bar-chart.scss",
		to: "dist/css/bar-chart.css",
		driver: "sass", // only sass supported for scss
		options: {
			minify: true,
			sourcemap: "file",
		},
		settings: {
			sass: {}, // settings for node-sass
			postcss: {}, // settings for postcss
			nextcss: {}, // settings for nextcss
			assets: {}, // settings for gulp-css-copy-assets
		},
	},
],
```

If `name` is not given, all componouts will be built one by one.

### watch [name]

When you are coding, you can run a `componer watch` task to build your code automaticly after you change your code and save the changes.

Only `src` directory is being watched.

If `name` is not given, all componouts's `src` will be being watched.

### preview <name>

Open browser to preview your code. `browser-sync` is used. preview options in `componer.config.js` make sense.

```
preview: {
	index: "preview/index.html", // required, html to use as home page
	script: "preview/bar-chart.js", // option, script to inject to home page, will be compiled by webpack
	style: "preview/bar-chart.scss", // option, will be compiled by sass
	server: "preview/server.js", // option, middlewares to be used by browser-sync, look into browser-sync config `middleware`
	tmpdir: ".preview_tmp", // option, default is '.preview_tmp'
	vendors: [], // option, modules to put into vendors file which will not be rebuild when reload. default "undefined", when preview, dependencies in .json file will be contained, so you do not need to include them.
	watchFiles: [ // look into browser-sync config `files`
		"preview/index.html",
		"preview/bar-chart.js",
		"preview/bar-chart.scss",
		"src/**/*",
	],
	watchOptions: {}, // look into browser-sync config `watchOptions`
},
```

1) index file

A html file, use `<!--styles-->` and `<!--vendors-->` `<!--scripts-->` for scripts files to be injected. If they are not found, css will be injected before `</head>` and scripts will be injected before `</body>`

2) server file

Export an object or an array or a function. Look into browser-sync middleware config.

3) scripts files

`script` and `style` files will be compiled and be kept in memory, not true local files (though files compiled will be created after page shown). All dependencies will be included in the compiled output content.

### test [name] [-D|--debug] [-b|--browser Chrome|Firefox|PhantomJS]

Componer use karma and jasmine as framework.

You can pass `-D` (short for --debug) and `-b` (short for --browser).

When use --debug mode, browser will be open, you can debug testing code in browser.

You can use --browser to change to test in different browser. For example, you can use Firefox. Only "Chrome" or "Firefox" or "PhantomJS" can be used. "PhantomJS" is default.

When you test a node module componout, it is different. You should modify `componer.config.js` `test.browsers` to be `Terminal`. If `test.browsers` = `Terminal`, jasmine-node will be used to test node scripts which can be run only in command line not in browsers. Do as so, `-b` will not work.

If `name` is not given, all componouts will be tested. `-D` will not work, and debug mode will be ignored.

### remove <name>

Remove the named componout, run `unlink` command if possible.

### list

List all componouts information.

### install [name] [-p|--package package-name] [-S|--save|-D|--savedev]

Install dependencies. If you want to install a package (npm or bower package) for a componout, you can run `componer install componout-name package-name`.

1) install a package for a componout

```
componer install componout-name -p package-name
```

New package will be put into node_modules directory in your project root path. However, a new dependence will be added into your componout `package.json` or `bower.json`.

npm packages always come first. For example, when you run `componer install my-component jquery`, jquery will be installed by npm into your root node_modules directory, event though there is a bower jquery. On the other hand, if npm run fail, bower packages will be try. eg. `componer install my-component d3`, d3 has only bower package, so npm install will fail and bower install will be run after the error message.

Pass `-S` to save this dependence to package.json or bower.json dependencies option, `-D` is to save to devDependencies. If you do not pass `-S` or `-D`. If you pass neither of them, .json files will not change. `-S` or `-D` is nouseful when there is no `-p`.

2) install all packages for a componout

```
componer install componout-name
```

Without a package name following componout name, all of the componout packages based on its .json files, including npm packages and bower packages, will be installed.

3) install all packages for all componouts

```
componer install
```

All npm packages and bower packages will be install in your project root path. `-p` and `-S` and `-D` is nouseful in this method.

**dependencies version**

When you run install task, you should know that compner will not help you to resolve your dependencies version problems. Then bebind versions will cover the previous ones and conflicts will be show and the end.

### link <name>

Link componout as package/component into node_modules/bower_components. Now only npm and bower supported.

In componer, components follow rules with bower components. So if you want to link your component as a bower component, you should pass `bower` to type option in componer.config.js:

```
module.exports = {
	name: 'componout-name',
	type: 'bower', // only npm and bower supported link task, other types will be ignored.
	build: [
		{
...
```

`bower` and `npm` are supported, other types will be ignore.

When you run `componer link a-name`, componer will run `npm/bower link` to link your componout. After you run `componer link a-name`, you can use `require('a-name')` in other componouts to use this componout.

### clone <name> [-u|--url your-git-registry-address]

Clone a compount from http://github.com/componer, by git.
You can change registries in `.componerrc` with `defaults` options.
If `-u` options is set, registry will be insteaded by this url.

You can try:

```
componer clone browser-logger
```

After that, a componout named `browser-logger` will lay in your componouts directory.
You will find this componout to be a git registry.

## Generator

All componer command should be run in a componer directory. How about the directory of componer directory?

```
--- your-project-directory
 `- componouts 			# all componouts will be put here
 |- gulp
 | `- tasks 			# all gulp tasks files, you can even modify by yourself
 | |- templates 		# componouts type templates
 | |- drivers			# webpack, sass and their config files
 | |- utils 			# gulp helper files
 | `- loader.js 		# basic functions and config loader
 |- bower_components
 |- node_modules
 |- gulpfile.babel.js
 |- package.json
 |- .componerrc 		# componer cli config of this project
 |- .bowerrc
 `- .babelrc
```

All files can be modified, but you should follow the rules.

## Componout

A componout should must contains a componer.config.js file, which provides build, preview, test information.

We have three default type of componout:

1) npm: use this type to create a npm package

2) component: use this type to create a component

3) app: use this type to create a website application or a plugin

Normal directory structure:

```
-- componout
 `- src
 | `- script
 | |- style
 | `- ...
 |- assets
 |- preview
 |- test
 | `- specs
 | |- data
 | |- reporters
 | `- ...
 |- dist
 |- componer.json
 |- README.md
 `- ...
```

You can use componer to create packages, components and applications. The difference amoung this types is componer.config.js, packages of npm always run in node environment, so the test options in componer.config.js is different, and there is no preview options. Applications will contains all dependencies, so there is not externals options in componer.config.js.

In the core idea of componer "组件是素材，不是作品。", I suggest developers to hold up component ideas. You build components, and provide to others to use. A component should follow the idea of **independence**.

When run build task, components' or packages' dependencies will not be packed by webpack. However, "bower_components" is automaticly considered as modules which can be require in source code, so just use bower component name to import the component.

However, bower components provide style files, such as bootstrap providing source less/sass files in main option in bower.json. If you use bower component instead of npm package, webpack will include this styles in javascript code.

`dependencies` options in bower.json or package.json will be external modules in built module componout. `devDependencies` in bower.json and package.json are no useful when building, but will be installed when you run `componer install` task.

All dependencies should be install in "bower_components" and "node_modules" directories in your componer root directory, which in your componout directories will be ignore when building. So run `componer install [name]` after you change the dependencies in .json files of componout manually.

## gulp tasks

Componer is a shell of node command, tasks are using gulp task framework, you can even modify the previous tasks for you special project. All tasks are in `gulp/tasks` directory.

You can even add a new gulp tasks in this directory, and run the new task by run `gulp new-task` in your componer directory.

Notice: you should follow [process.args](https://github.com/tangshuang/process.args) to use cli parameters.

## MIT License

Copyright 2016 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
