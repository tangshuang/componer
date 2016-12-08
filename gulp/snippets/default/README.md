# {{Component Name}}


## Install

## Usage

## Options

## Methods/API

## Devenlopment

**Componer**

This package is written by ES6, use [componer](https://github.com/tangshuang/componer) to build source code.

**componer.json**

* packOne: whether to pack this component in a js file, if true no css/images will be built in dist
* packEntry: which file to be the entry file
* dependenceis: an array contains the name list of dependencies, dependencies will not be pack in, refere to webpack `externals` config. e.g. you can put `jquery` in the list, and use `require("jquery")` in your code.