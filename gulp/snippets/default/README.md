# {{Component Name}}


## Install

## Usage

## Options

## Methods/API

## Devenlopment

**Componer**

This package is written by ES6, use [componer](https://github.com/tangshuang/componer) to build source code.

**componer.json**

```
{
	"name": "{{component-name}}", // your component name
	"pack": true, // whether pack all sources into a .js file, contains css, images, fonts
	"entry": "src/index.js", // which is the entry file to be pack with by webpack
	"settings": { // if pack is true. webpack configuration
		"externals": {},
		"resolve": {
			"packageAlias": "bowerComponents",
			"alias": {}
		}
	}
}
```