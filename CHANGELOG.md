### 0.3.1

1. remove `cpon` commander, only use `componer`. i.e. use `componer build` in a single componout dir.
2. use cssnano, remove cssmin
3. update webpack config file for webpack2. developers should run `npm install webpack@2.x` to install new version webpack in your project directory.
4. add a new commander `use` to use other node modules. i.e. `componer use webpack@2.x` to use new version if you run commander in a single componout dir. webpack2 will be install in global componer dependencies, if you want to reset default modules, just run `componer use [default]`.


### 0.3.0

1. modify componer.json: make preview and test entry files more controllable
2. update preview task and test task
3. use sleep to fix preview bug when vendors created async
