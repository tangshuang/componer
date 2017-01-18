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

componer pull name
componer push name [origin master]

componer install [name]
componer link [name]
```

### init

After your `npm install -g componer`, you should create a empty directory, and enter it to run `componer init`. Then you will see different files be initialized into this directory.

This directory is called `componer` directory.

When you run `componer init`, it will ask you two questions: your github name and the package name. The value you typed in will be found in `package.json`. So you can modify the file later.
Your github name is important, because it will be used when you run `componer add`. If you do not give a `--author` parameter when you run `componer add` task, componer will use your github name to create the package github registry address.

### add <name> [-t bower -a your-github-name]

Add a componout. A `componout` is a production created by componer.

Componout name should must be given.

When you run `componer add` task, you can pass `-t` and `-a` parameters. `-t` is short for `--type`, if you run `componer add my-test -t npm`, my-test componout will be a npm package. Default types are directory names in `gulp/templates`.

If it runs successfully, you will find a new dirctory in componouts directory.

If you want to add a new type of componout, just create a new dirctory in your gulp/templates directory. Type name is the directory name. In template file, you can use `{{component-name}}` as string template.

### build [name]

When you run build task, componer will compile your ES6 code to ES5 code and combine your code into one file by webpack. 
At the some time, scss files will be compiled to css files, minified by cssmin, and be put in `dist` directory too.

However, componer.json is a special file which is used for compiling.

**componer.json**

```
{
	"entry": {
		"script": "src/script/{{componout-name}}.js", // which javascript file to build from
		"style": "src/style/{{componout-name}}.scss", // which style file to build from
		"assets": "assets", // which directory to copy static files from
		...
	},
	"output": {
		"script": "dist/js", // which directory to put built javascript files
		"style": "dist/style", // which directory to put built css files
		"assets": "assets", // which direcotry to put static files
		...
	},
	"webpack": { // webpack config
		"_minify": true, // whether to minify built javascript
		"output": {
			"filename": "{{componout-name}}.js",
			"libraryTarget": "umd",
			"library": "{{componoutName}}",
			"sourceMapFilename": "{{componout-name}}.js.map",
			"publicPath": "assets"
		},
		"externals": {},
		"resolve": {
			"alias": {}
		},
		"devtool": "source-map" // remove this if you dont want to use sourcemap file
	},
	"sass": {
		"_minify": true,
		"output": {
			"filename": "{{componout-name}}.css",
			"sourcemap": "file" // "inline" or "file"
		}
	},
	...
}
```

If `name` is not given, all componouts will be built one by one.

### watch [name]

When you are coding, you can run a `componer watch` task to build your code automaticly after you change your code and save the changes. Only `src` directory is watched.

If `name` is not given, all componouts will be watched.

### preview

When you preview a componout, it will firstly build it into a `.tmp` directory and then setup a local static webserver to preview your componout. 

You should give a index.html and a index.js file in your preview directory (which is point out in your componer.json). These two files are neccessary, or your preview task will fail. However, you can put a index.scss and server.js in your preview directory. index.scss is used for styles entry, which will be built by sass. And server.js is used for a backend server.

### test [name]

Componer use karma and jasmine as framework. 

You can pass `-D` (short for --debug) and `-b` (short for --browser). 
When use --debug mode, browser will be open, you can debug testing code in browser.
You can use --browser to change to test in different browser. For example, you can use Firefox. Only "Chrome" or "Firefox" or "PhantomJS" can be used. "PhantomJS" is default.

When you test a node module componout, it use jasmine-node to test it. 

If `name` is not given, all componouts will be tested. But debug mode can not be used.

### remove

Remove the named componout, run `unlink` command if possible.

### list

List all componouts information.

### install [name]

Install dependencies.

### link

Link componout as package. If there is a bower.json in your componout, it will be link to bower_components, if without bower.json there is a package.json, it will be link to node_modules.

### pull

Pull your git registry from http://github.com/componer

### push

Push your componout to http://github.com/componer if you have the permission.

## Workspace

All componer command should be run in a componer directory. How about the directory of componer directory?

```
--- your-project-directory
 `- componouts # all componouts will be put here
 |- gulp
 | `- tasks # all gulp tasks files, you can even modify by yourself
 | |- templates # componouts type templates
 | |- utils # gulp helper files
 | `- loader.js # basic functions and config loader
 |- bower_components
 |- node_modules
 |- gulpfile.babel.js
 |- webpack.config.js # basic webpack config
 |- karma.config.js # basic karma config
 |- package.json
 |- .componerrc # componer config info in this workspace
 |- .bowerrc
 `- .babelrc
```

All of workspace files can be modified, but you should follow the rules.

## Componout

A componout should must contains a componer.json file, which provides build, preview, test information.

We have three default type of componout:

1) npm: use this type to create a npm package

2) bower: use this type to create a component, following bower specs

3) default: uset this type to create a website application or a plugin

Normal directory structure:

```
-- componout
 `- src
 | `- script
 | |- style
 | |- assets
 | `- ...
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

In the core idea of componer "组件是素材，不是作品。", I suggest developers to hold up component ideas. You build components, and provide to others to use. A component should follow the idea of **independence**. 

When you use componer to build a componout, if there is a bower.json in the componout directory, it will be considered as a component. Without bower.json, but there is a package.json, it will be considered as a npm package.

When run build task, components' or packages' dependencies will not be packed by webpack. However, "bower_components" is automaticly considered as modules which can be require in source code, so just use bower component name to import the component.

`dependencies` options in bower.json or package.json will be external modules in built componout. `devDependencies` in bower.json and package.json are no useful when building, but will be installed when you run `componer install` task.

All dependencies should be install in "bower_components" and "node_modules" directories in your componer root directory, which in your componout directories will be ignore when building. So run `componer install [name]` after you change the dependencies in .json files of componout.

## gulp tasks

Componer is a shell of node command, tasks are using gulp task framework, you can even modify the previous tasks for you special project. All tasks are in `gulp/tasks` directory.

You can even add a new gulp tasks in this directory, and run the new task by run `gulp new-task` in your componer directory.

Notice: you should follow [process.args](https://github.com/tangshuang/process.args) to use cli parameters.

## MIT License

Copyright 2016 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.