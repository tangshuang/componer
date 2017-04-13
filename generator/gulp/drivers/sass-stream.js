import path from 'path'
import gulp from 'gulp'
import sass from 'gulp-sass'
import cssmin from 'gulp-cssmin'
import postcss from 'gulp-postcss'
import cssnext from 'postcss-cssnext'
import rename from 'gulp-rename'
import sourcemaps from 'gulp-sourcemaps'
import concat from 'pipe-concat'
import bufferify from 'gulp-bufferify'
import cssCopyAssets from 'gulp-css-copy-assets'
import SeparateVendors from 'gulp-sass-separate-vendors'

import sassConfig from './sass.config'

/**
@desc build scss to css
@param string from: entry scss file absolute path
@param string to: out put css file absolute path
@param object options: {
	boolean minify: whether to minify css code,
	boolean sourcemap: whether to use sourcemap,
	object vendors: {
		enable: -1|0|1, 1 => only vendors, 0 => ignore this operate, -1 => without vendors, default 0
		modules: boolean|array, true => all vendors, array => only these vendors will be seperated, default true
	}

	function before(settings): to run before build,
	function process(content, file, context): during building,
	function after(): run after build,
}
@param object settings: {
	object sass:
	object postcss:
	object nextcss:
	object assets: settings for gulp-css-copy-assets
}
@return streaming
*/

export default function(from, to, options = {}, settings = {}) {
	var outputdir = path.dirname(to)
    var filename = path.basename(to)
	var basename = path.basename(to, '.css')
	var sourcemapdir = options.sourcemap === 'inline' ? undefined : './'
    var plugins = [
        cssnext(settings.cssnext),
	]

	var enable = options.vendors && options.vendors.enable
	var modules = options.vendors && options.vendors.modules
	var modifier = (factory, ...args) => {
		if(typeof factory === 'function') return factory(...args)
		return bufferify(() => {})
	}
	var separator = SeparateVendors({
		vendors: modules,
		output: enable
	})

	// do something before build
	if(typeof options.before === 'function') {
		options.before(settings)
	}

	var stream = gulp.src(from)
		.pipe(modifier(options.sourcemap ? sourcemaps.init : null))
		.pipe(modifier(enable ? separator.init : null))
		.pipe(sass(sassConfig(settings.sass)))
		.pipe(modifier(enable ? separator.extract : null))
		.pipe(postcss(plugins, settings.postcss))
		.pipe(modifier(options.minify ? cssmin : null))
		.pipe(rename(filename)) // ??? does this rename vendors file???
		.pipe(bufferify((content, file, context, notifier) => {
			if(typeof options.process === 'function') {
				content = options.process(content, file, context, notifier)
			}
			return content
		}))
		.pipe(modifier(options.sourcemap ? sourcemaps.write : null, sourcemapdir))
		.pipe(cssCopyAssets(settings.assets))
		.pipe(gulp.dest(outputdir))

	return stream.on('end', () => {
		if(typeof options.after === 'function') {
			options.after()
		}
	})
}
