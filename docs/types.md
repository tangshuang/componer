# Types of Componer

In componer there are three given types: package, bower and default.


## defualt

It is an **application** after building, which can run in browser.

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

It is a **package** of node module after building, which will have a package.json file.

You should use `export` and `import` in your source code to follow ES6 modules specification.
Do NOT think about the result of building, componer will give you a package which can be run in node.

Notice! A package is always like a component. But it is not! A package is a tool, a component is just a component. A package can do something by itself, like npm, but a component can not, components have to be used by other code products to contribute their feature.

What componer do is to build your ES6 module code to ES5, which can be used by node lower version.

Use components in your package when you are coding. 
Don't think about dependencies, if you use a component (which is imported in your code, and lays in bower_components directory), componer will build it into your code, however, node modules will not be built into, because there is no need.
To realize this goal, please read [this article]() to know more about `components` in package.json.

## bower

It is a **component** after building, which contains a bower.json file.