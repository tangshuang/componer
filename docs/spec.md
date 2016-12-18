# Component Spec

Rules you should follow to create your component.

## package

A npm package which runs in node environment is usually follows `CommonJS` modules. So, when you run a `add` task with `--type=package`, you can find the new package contains a component named js file in src directory.

You can `require` or `import` in this js files, after you run `gulp build` task, the package codes will build by babel, and all built files will lay in `dist`. In fact, the built files follow CommonJS also, this is the reason why all files in `dist` like copied from `src`.

## bower

A bower component is different from a npm package, a bower component is always used in brower side. In browser client environment, no original modules is provided, so `UMD` is used to adapt to client side environment.

You can code in src directory following CommonJS/ES6 Modules. After your coding, webpack will pack all js codes beginning with `src/js/component-name.js`, this file is the entry file.

What to do with dependencies? For example, your component is dependented on jquery, what should you do?

There are two choice: 1. pack jquery in component, so that users can use the component anywhere, 2. do not pack in, but record as a dependence. Componer choosed the second rule. Because we have `require.js` in frontend. Now what should you do? 

Just put jquery in dependencies in `bower.json` as bower always do. Dependences in `dependencies` will be include in built files, but in `devDependences` will not, devDpendences will only be used when preview.

Componer use sass to build css, `src/style/component-name.scss` is the entry file. Notice that, all images and fonts will **not** be packed in the final css! Because we always want to use a image from a static server by url. So absolute url is recommended.

## component

A component is a project, which can be provide all services in one package. For example, a chart component with settings, different chart views, data sources apis.

A component can work without any another dependencies. It works everywhere, provide apis. 
So at last, the component will be build into a file to contains all it dependencies.

This is recommended, however, you can change config in `componer.json`.