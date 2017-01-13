# Componer

Componer is a workflow tool to help frontend developers to coding more easily.
Support ES6. On the shoulders of gulp, bower, webpack, karma, jasmine and so one. THANKS!

## Definition

`componer` is this tool's name.
After you initialize in a directory, the directory is called a componer directory.

`componout` is a production created by componer.
All componouts are lay in `componouts` directory, this directory is the main directory you work in.

`componer.json` is the special file which tells componer entry files and compile or test information.
You should pay attention to this file before you run `componer build`.

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
componer test [name]
componer remove/rm name
componer list/ls

componer pull name
componer push name [origin master]

componer install [name]
componer link [name]
```

After your `npm install -g componer`, you should create a empty directory, and enter it to run `componer init`. Then you will see different files be initialized into this directory.

When you run `componer init`, it will ask you two questions: your github name and the package name. The value you typed in will be found in `package.json`. So you can modify the file later.
Your github name is important, because it will be used when you run `componer add`. If you do not give a `--author` parameter when you run `componer add` task, componer will use your github name to create the package github registry address.

When you run `componer add` task, you can pass `-t` and `-a` parameters. `-t` is short for `--type`, if you run `componer add my-test -t npm`, my-test componout will be a npm package. Default types are directory names in `gulp/templates`.

When you run build task, componer will compile your ES6 code to ES5 code and combine your code into one file by webpack. 
At the some time, scss files will be compiled to css files, minified by cssmin, and be put in `dist` directory too.

However, before you run `componer build`, you should learn more about [componer.json]().

When you are coding, you can run a `componer watch` task to build your code automaticly after you change your code and save the changes. Only `src` directory is watched.

When you preview a componout, it will firstly build it and then setup a local static webserver to preview your componout. You should write scripts in your preview entry file to require all dependencies.

When you test a componout, it use karma and jasmine as framework.

This is what componer can help you to `add -> build -> preview -> test` in your project.

## Index

- [introduce](./docs/intro.md)
- [cli](./docs/cli.md)
- [types](./docs/types.md)

## For Developers

If you are a developer and want to develop this tool, you should follow some rules. If you do not do like this, your hard work may be wasted.
Later I will write more docs, just wait~