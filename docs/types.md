# Types of Componer

In componer there are three given types: package, bower and default. In different type snippet directory in `gulp/snippets`, you can find package.json, bower.json, and componer.json. They are used for different result built by componer.

## defualt

If there is a `componer.json` in your component directory, it means you want this component to be an **application** after building, which can run in browser.

Keep in mind: you are now want to create an application!
This means you will use many components in your source code.
Use `export` and `import` in your source code to follow ES6 modules specification.

A `componer.json` has been given, which can help you build your application more smoothly.
You can get more information [here]() about componer.json.

However, componer is a builder. You must give some entry files in componer.json. 
In the entry js file, import components or other modules in the directory, and finish program.
After building, normally, you can open `dist/index.html` (if you give a template entry file) and find it runs as an application in browser. All js will be pack in a file by webpack, and scss files will be compiled in a css file.

Visit the [link]() to learn about how to deal with static files.

Some words by frustigor:

Don't worry about code repetitive rate, componer do it.
Don't worry about dependencies, componer do it.
Don't worry about anything, componer do it.
Just enjoy your application at the end, no matter it is a website, a native app or a single page.
Keep in mind, use components, pass options, arrange logic, and done!

## package

If there is a `package.json` in your component directory, it means you want to get a **package** of `node module` after building.

You should use `export` and `import` in your source code to follow ES6 modules specification.
Do NOT think about the result of building, componer will give you a package which can be run in node.

Notice! A package is always like a component. But it is not! A package is a tool, a component is just a component. A package can do something by itself, like npm, but a component can not, components have to be used by other code products to contribute their feature.

What componer do is to build your ES6 module code to ES5, which can be used by node lower version.

Use components in your package when you are coding. 
Don't think about dependencies, if you use a component (which is imported in your code, and lays in bower_components directory), componer will build it into your code, however, node modules will not be built into, because there is no need, then can be required easily.
To realize this goal, please read [this article]() to know more about `bowerComponents` in package.json. When you `import`, components in `bowerComponents` will be built in package.json in root directory (the same level with gulpfile.babel.js), and packages in `dependencies` in package.json will not.

## bower

If there is a `bower.json` in your component directory, it means you want to get a **component** after building, which will be used by other packages.

If you want use componer to build a component, you should follow bower component specification. 
Componer consider bower to manage your components, npm is a package manager, not a component manager.
Learn more about [componer main idea](http://www.tangshuang.net/2974.html).

However, it is a little strange. You write some code and build it to be a component, there, during the coding, you use some other components.

Anyway, use ES6 module to code in your component source code.
Don't think about the building result.
Don't think about the dependencies. If you use some other components in your component, firstly, add them to bower.json dependencies, run `componer bower [name]`, then use `import` in your code. Componer will solve dependencies for you. 

Dependencies code is not built into your component, but will be use when you create a default type product *application*.
What put in bower.json devDependencies will not be built when you built your application. These dependencies will be used when you run `componer test [name]`. For example, your component does not need to use jquery, but in your unit test script, you want to use jquery, you can put jquery in `devDependencies`, and use `import $ from "jquery"` in your test code.
After you add your dependencies, run `comoner bower [name]` to install these dependencies.
When you build your application, only `denpendencies` will be used, `devDependencies` will not.