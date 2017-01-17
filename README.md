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