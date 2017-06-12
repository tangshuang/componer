# Componer

Componer is a workflow tool to help frontend developers to coding more easily.
Support ES6. On the shoulders of gulp, bower, webpack, karma, jasmine and so on.

## Install and initialize

We have two commander `componer` and `componout`, `componer` is for projects which have `.componerrc` and `componout` is for componouts which have `componer.json`, However a componout could be from a project.

```
# install componer globally
npm install -g componer
```

However, you have a way to use it without install it globally.

```
git clone https://github.com/tangshuang/componer.git && cd componer
npm install && npm run build && npm link
```

With runing link, you can use componer commanders in local without installing.

```
# initialize a project
mkdir test-project && cd test-project && componer init
```

After this, you will get a project which contains special directory structure.

```
# initialize a componout which is not in a componer project
mkdir test-componout && cd test-componout && componout init
```

Answer the questions, and get a componout by special template.

If you only want to create a componout, run:

```
mkdir my-componout && cd my-componout
cpon init
```

`cpon` commander is a simple commander to run in a componout directory with a componer.json file in it.

## Usage of componer commander

```
componer -v
componer -h

componer init
componer reset
componer add componoutname [-t templatename|typename -a yourgitname]
componer build [componoutname]
componer watch [componoutname]
componer preview componoutname
componer test [componoutname] [-D] [-b Chrome|Firefox|PhantomJS]
componer remove/rm componoutname
componer list/ls

componer clone componoutname

componer install [for componoutname]
componer install packagename for componoutname
componer link [componoutname]
```

### componer init

After your `npm install -g componer`, you should create a empty directory, and enter it to run `componer init`. Then you will see different files be initialized into this directory.

This directory is called a componer project directory.

When you run `componer init`, it will ask you two questions: your github name and the package name. The value you typed in will be found in `package.json` and `.componerrc`. So you can modify the file later.
Your github name is important, because it will be used when you run `componer add`. If you do not give a `--author` parameter when you run `componer add` task, componer will use your github name to create the package github registry address.

`init` commander will run 'npm install' at the last automaticly.

### componer reset

When you use a new version of componer, your local project files a older one. If you want to use componer default program files, you can run update commander.
However, files in `gulp` directory and `gupfile.babel.js` will be covered, so if you have ever changed these files, do not run update directly.

'npm install' will be run automaticly after files updated.

### componer add <name> [-t|--template default] [-a|--author your-name]

Add a componout. A `componout` is a production created by componer.

Componout name should must be given.

When you run `componer add` task, you can pass `-t` and `-a` parameters. `-t` is short for `--template`, if you run `componer add my-test -t npm`, my-test componout will be a npm package. Default templates are directory names in `gulp/templates`. In fact, a template is a type of componout, so you will see I use type instead of template in the following content.

If it runs successfully, you will find a new dirctory in componouts directory.

If you want to add a new type of componout, just create a new dirctory in your gulp/templates directory. Template name is the directory name. In template file, you can use `{{component-name}}` and `{{author-name}}` as string template.

`defaults.template` and `project.author` options in `.componerrc` in your project root path will be used as default values if you not give a -t or -a option.

### componer build [name]

When you run build task, componer will compile your ES6 code to ES5 code and combine your code into one file by webpack.

At the same time, scss files will be compiled to css files, minified by cssmin, and be put in `dist` directory too.

However, `componer.json` is a special file which has information used for compiling for a componout.

Use an array to arrange compile files:

```
"build": [
	/* compile and bundle javascript, judged by from file */
	{
		/* entry file to build with */
		"from": "src/script/bar-chart.js",

		/* output file after be built */
		"to": "dist/js/bar-chart.js",

		"options": {
			/* create another .min.js file */
			"minify": true,

			/* create sourcemap file */
			"sourcemap": true,

			/**
			vendors to be separated into a .vendors.js file, have three options: array, true, false.
			true: all dependencies (in bower.json or pacakge.json) will be put in a .vendors.js.
			array: only dependencies in this array will be put into the .vendors.js file, others will be bundled in the dist file.
			false: no .vendors.js will be generated and all externals will be ignored in the final bundled file. However, you can use webpack settings `externals` to arrange your externals.
			**/
			"vendors": []
		},

		/* settings for webpack-stream */
		"settings": {}
	},

	/* compile scss to css */
	{
		"from": "src/style/bar-chart.scss",
		"to": "dist/css/bar-chart.css",
		"options": {
			"minify": true,
			"sourcemap": true
		},
		"settings": {
			"sass": {}, // settings for node-sass
			"postcss": {}, // settings for postcss
			"nextcss": {}, // settings for nextcss
			"assets": {} // settings for gulp-css-copy-assets
		}
	}
],
```

You can use only one object, if you have only one file to build:

```
"build": {
	"from": "src/script/bar-chart.js",
	"to": "dist/js/bar-chart.js",
	"options": {
		"minify": true,
		"sourcemap": true,
		"vendors": false
	}
},
```

If `name` is not given, all componouts will be built one by one.

### componer watch [name]

When you are coding, you can run a `componer watch` task to build your code automaticly after you change your code and save the changes.

Only `src` directory is being watched.

If `name` is not given, all componouts's `src` will be being watched.

### componer preview <name>

Open browser to preview your code. `browser-sync` is used. preview options in `componer.json` make sense.

```
"preview": {
	/* html to use as home page */
	"index": "preview/index.html", // required

	/* script to inject to home page, will be compiled by webpack */
	"script": "preview/bar-chart.js",

	/* will be compiled by sass */
	"style": "preview/bar-chart.scss",

	/* middlewares to be used, look into browser-sync config `middleware` */
	"server": "preview/server.js",

	/* tmp dir to put preview tmp files */
	"tmpdir": ".preview_tmp", // default: '.preview_tmp'

	/**
	vendors to be separated into a .vendors.js file, have three options: array, true, false.
	true: all dependencies (in bower.json or pacakge.json) will be put in a .vendors.js.
	array: only dependencies in this array will be put into the .vendors.js file, others will be bundled in the dist file.
	false: no .vendors.js will be generated and all externals will be ignored in the final bundled file. However, you can use webpack settings `externals` to arrange your externals.
	Why we need this? Because when you preview, browser will refresh automaticly after you change your watch files (in the following), bundle js being built, separate vendors avoid to build this vendors into re-build bundle file, which save your time.
	**/
	"vendors": true,

	/* look into browser-sync config `files` */
	"watch": [
		"preview/index.html",
		"preview/bar-chart.js",
		"preview/bar-chart.scss",
		"src/**/*",
	],
	/* look into browser-sync config `watchOptions` */
	"watchOptions": {}
},
```

1) index file

A html file, use `<!--styles-->` and `<!--vendors-->` `<!--scripts-->` for scripts files to be injected.

2) server file

Export an object or an array or a function.
Look into browser-sync middleware config.

3) scripts files

`script` and `style` files will be compiled and be kept in memory, not true local files (though files compiled will be created after page shown).

### componer test [name] [-D|--debug] [-b|--browser PhantomJS|Chrome|Firefox|IE|Safari]

Componer use karma and jasmine as framework.

You can pass `-D` (short for --debug) and `-b` (short for --browser).

When use --debug mode, browser will be open, you can debug testing code in browser.

You can use --browser to change to test in different browser. For example, you can use Firefox. Only "Chrome" or "Firefox" or "PhantomJS" can be used. "PhantomJS" is default.

When you test a node module componout, it is different. You should modify `componer.json` `test.browsers` to be `Terminal`. If `test.browsers` = `Terminal`, jasmine-node will be used to test node scripts which can be run only in command line not in browsers. Do as so, `-b` will not work.

If `name` is not given, all componouts will be tested. `-D` will not work, and debug mode will be ignored.

**Notice:** if you want to use PhantomJS, you should install PhantomJS browser first on you compouter, it is a browser.

### componer remove <name>

Remove the named componout, run `unlink` command if possible.

### componer list

List all componouts information.

### componer install [for name] [-F|--force]

Install all dependencies for a componout based on its bower.json and pacakge.json.

```
componer install for my-componout
```

If you do not pass componout name, all componouts' dependencies will be installed. This is always run at the first time after you clone your project.

```
componer install
```

Packages will be put into node_modules/bower_components directory in your project root path. So all packages are shared amoung different componouts.

**bower always come first**

In componer, bower components always come before npm packages.
For example, if you install a package which has both bower and npm packages, bower package will be recommended to install firstly. If you `require` a package, and this package has both bower and npm packages in local directory, bower component will be used firstly.

**virtual cache**

If a package exists in local, no matter in bower_components or node_modules, it will not be installed again.

If you want to force install a new version, you can pass `-F|--force` to install, e.g. `componer prepare xxx -F`. Then no matter what packages there are in local, all xxx dependencies will be install (may cover local pacakges version).

**version**

When you run `prepare` task, you should know that compner will not help you to resolve your dependencies version problems. Bebind versions will cover the previous ones and conflicts will be show and the end.

For example, you run `componer prepare` to install all dependencies of your componouts. Different dependence packages may have different versions. Only the last same named package's version componer meets will be installed.

However, virtual cache works, if you install all dependencies packages, if a dependence package exists in local, it will not be installed again. Use `--force` to install all dependencies if you want to reinstall all dependencies.

**download directory**

Componer keep only one same name package in local, for example, if there is a jquery installed in bower_components, no matter which version it has, jquery will never be installed again (until you use `-F`).

Bower and npm packages are put in different directories. But, only one package will be installed, even if there are two pacakges have the same name and from bower.json and package.json. Remember *bower always come first*.

### componer install <package>[@version] for|to <name> [-D|--dev] [-F|--force]

Install a package for a componout.

```
componer install jquery for my-componout
```

New package will be put into node_modules/bower_components directory in your project root path. A new dependence will be added into your componout's `package.json` or `bower.json`.

Bower components always come first. So if your componout has a bower.json, new packages will always be installed by bower. But if a package has only npm package, bower install will fail, when this happens, npm install will be run to install this package.

`-D` is to save to devDependencies. If you do not pass `-D`, new pacakge will be save to `dependencies`.

`-F` is to install new package ignore local virtual cache.

**version conflicts**

But force install may cause version conflicts. For example, one of your componouts dependents on jquery@1.12.0, but you try `jquery --force`, the latest version of jquery will be download, and old verison will be covered. So you should have to update your componouts to support higher version jquery manually.

### componer link <name> [-F|--force]

Link (Symbolic link) componout as package/component into node_modules/bower_components.

In componer, components follow rules with bower components. So if you want to link your component as a bower component, you should create your componout as a bower component with bower.json.

Firstly, `type` option in your componout's componer.json should be set to 'bower' or 'npm'. If type is bower, and there is a bower.json in your componout dirctory, it will be linked as bower component. The same logic, npm package needs type to be 'npm' and there is a package.json in your componout.

After you run `componer link a-name`, you can use `require('a-name')` in other componouts to use this componout.

There is not a `unlink` task. It means you should have to unlink your packages by manual.
However, when you remove componouts, unlink will be automaticly run by componer.

**Notice:** on windows, it is different. If you have no permission to do `ln`, and you pass `-F`, componer will use `bower/npm link` instead. For this, you have to know about `bower link` and `npm link`. Or componer will copy componout to packages directory, so you have to run `link` again after you update your code.

### componer clone [name] [-u|--url your-git-registry-address] [-I|--install] [-L|--link]

Clone a componout from http://github.com/componer, by git.
You can change registries in `.componerrc` with `defaults` options.
If `-u` options is set, registry will be insteaded by this url.

You can try:

```
componer clone class-base
```

After that, a componout named `class-base` will lay in your componouts directory.
You will find this componout to be a git registry.

`-I` is to run `componer install` task after this componout cloned to install its dependencies.
`-L` is to run `componer link` task after it cloned to link it to package directories.

If you do not pass a name to the cli, all of `dependencies` in .componerrc will be download into componouts directories. *Notice, dependencies in .componerrc are different from ones in bower.json or pacakge.json, they are only use for clone, not for package dependencies.* So after you clone from git, you should run componer install to install their dependencies.



## single componout commanders

Componer provide a single commander to run in a local componout directory. For example, you git clone a registry which has a componer.json from github, and do not want to create a componer project, want to re-build the componout, you can do like this:

```
git clone https://github.com/xxx/xxx.git && cd xxx
# install dependencies
componer install
# build
componer build
```

Just run following commanders in your componout dir.

In fact, you should know that when you run single componout commanders, componer will use its self rules to build your code. So we recommend you to use componer project mode.

### componer add

create a new componout with componer templates, which has four type: component, npm, bower and app. Componer will ask you some questions, you could just follow the questions and give the answers.

### componer install

Install dependencies for current componout. All npm and bower dependencies will be installed in current directory.

### componer build

Build current componout following the default rule of componer.

If you use componer to create a componer project, you can change the files in gulp directory to build up your own workflow, but if you use `cpon`, it will use componer default workflow rules.

### componer preview

Preview current componout by browsersync.

### componer test

Test current componout by karma and jasmine.

### componer use [package|default]

However, componer use webpack1.x as default dependence. If you run single commanders in your current componout dir, you will have no chance to use new version modules. So componer provide a way to update original dependencies. Use `use` commander to update:

```
componer use webpack@2.x
```

Then you will enjoy tree shaking when running `componer build` in a componout dir.

When you want to reset all dependencies, run:

```
componer use
// or
componer use default
```

All dependencies will be reinstalled.

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

A componout should must contains a componer.json file, which provides build, preview, test information.

We have three default type of componout:

1) npm: use this type to create a npm package, which is created for node runtime modules, not for browser-end.

2) bower: use this type to create a bower component, which is created for browser-end used, not for node runtime.

3) app: use this type to create a website application, which is NOT used as a node runtime module or browser-end package. So in app template directory, bower.json and package.json only contains (dev)dependencies options.

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

You can use componer to create node runtime packages, browser-end components and applications. The difference amoung this types is componer.json, packages of npm always run in node environment, so the test options in componer.json is different, and there is no preview options. Applications will contains all dependencies, so there is not externals options in componer.json.

In the core idea of componer "组件是素材，不是作品。", I suggest developers to hold up component ideas.
You build components, and provide to others to use directly, but in fact, you do NOT need to build, because others developers who use your component will use your components source code to build all by themselves. So you can see in default component template, main option in bower.json and package.json are point to src files, not built files.
*Keep in mind that components are used as resources of other productions, not as productions.*
A component should follow the idea of **independence**.

When run build task, components' or packages' dependencies will not be packed by webpack. However, "bower_components" is automaticly considered as modules which can be require in source code, so just use bower component name to import the component.

However, bower components provide style files, such as bootstrap providing source less/sass files in main option in bower.json. If you use bower component instead of npm package, webpack will include this styles in javascript code.

`dependencies` options in bower.json or package.json will be external modules in built module componout. `devDependencies` in bower.json and package.json are no useful when building, but will be installed when you run `componer install` task.

All dependencies should be install in "bower_components" and "node_modules" directories in your componer root directory, which in your componout directories will be ignore when building. So run `componer install [name]` after you change the dependencies in .json files of componout manually.

**The order of packages loaded by webpack**

In componer, if you use `require('some-module')` or `import 'some-module'` to include a external module, componer will use webpack to build all codes together. However, not all modules lay in node_modules directory, you can use bower_components packages and componouts as modules. The order to find module is `bower_components > node_modules > componouts`, so after you create a component in your componouts directory, you do NOT need to link it to modules dirctory. But if there are three same package in bower_components, node_modules and componouts, which in bower_components will be used as default. However, you can use `componer link` to link a componout to bower_components to improve its priority. (We use a plugin which makes bower components higher then node modules.)

But if you want to use `@import 'some-module';` in sass, you MUST link it to modules dirctory. Style files always can be used as bower packages. Just remember this.

**Share project**

1) setup your project

You could install bower to support bower components in your poject. And create a `.bowerrc` to set default config of bower.

Babel config is default put in package.json. You could mv it to `.babelrc`. However, if you want to publish your project minimality, you could just change package.json.

`.jshintrc` is used to check your code, if you want to ignore some warning, add this file and add your own rules.

2) minimality share project

If you want to share your project minimality, you can only pack `components`, `.componerrc` and `package.json`, push them to git registry.

```
- componouts
  |- componout1
  |- componout2
  `- ...
- .componerrc
- package.json
```

**Notice:** do NOT push your test reporters, preview tmp dirs and dist dirs to your registry.

After another developer cloned your code, he/she could only run:

```
componer reset -I
```

All componer relative files will be recover.

## gulp tasks

Componer is a shell of node command, tasks are using gulp task framework, you can even modify the previous tasks for you special project. All tasks are in `gulp/tasks` directory.

You can even add a new gulp tasks in this directory, and run the new task by run `gulp new-task` in your componer directory.

Notice: you should follow [process.args](https://github.com/tangshuang/process.args) to use cli parameters.

## MIT License

Copyright 2016 tangshuang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
