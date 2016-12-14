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
	"entry": { 
		// which is the entry file to be pack with by webpack
		// if there is no js or style entry file, js or style will not be build, but you can follow webpack to require(css) in entry js file
		"js": "src/js/{{component-name}}.js",
		"style": "src/style/{{component-name}}.scss"
	},
	"output": {
		// which directory to put built files
		"js": "dist/js/",
		"style": "dist/css/"
	},
	"settings": { // settings will be merged with webpack configuration
		"externals": {},
		"resolve": {
			"packageAlias": "bowerComponents",
			"alias": {}
		}
	}
}
```