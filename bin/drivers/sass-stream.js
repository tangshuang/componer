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
import sassConfig from './sass.config'

/**
@desc build scss to css
@param string from: entry scss file absolute path
@param string to: out put css file absolute path
@param object options: {
	boolean minify: whether to minify css code,
	boolean sourcemap: whether to use sourcemap,
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

    function NoSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sass(sassConfig(settings.sass)))
			.pipe(postcss(plugins, settings.postcss))
			.pipe(rename(filename))
			.pipe(bufferify((content, file, context) => {
	            if(typeof options.process === 'function') {
	                content = options.process(content, file, context)
	            }
	            return content
	        }))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapNoMinify() {
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass(sassConfig(settings.sass)))
			.pipe(postcss(plugins, settings.postcss))
			.pipe(rename(filename))
			.pipe(bufferify((content, file, context) => {
	            if(typeof options.process === 'function') {
	                content = options.process(content, file, context)
	            }
	            return content
	        }))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	function NoSourceMapHasMinify() {
        filename = basename + '.min.css'
		return gulp.src(from)
			.pipe(sass(sassConfig(settings.sass)))
			.pipe(postcss(plugins, settings.postcss))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(bufferify((content, file, context) => {
	            if(typeof options.process === 'function') {
	                content = options.process(content, file, context)
	            }
	            return content
	        }))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	function HasSourceMapHasMinify() {
        filename = basename + '.min.css'
		return gulp.src(from)
			.pipe(sourcemaps.init())
			.pipe(sass(sassConfig(settings.sass)))
			.pipe(postcss(plugins, settings.postcss))
			.pipe(cssmin())
			.pipe(rename(filename))
			.pipe(bufferify((content, file, context) => {
	            if(typeof options.process === 'function') {
	                content = options.process(content, file, context)
	            }
	            return content
	        }))
			.pipe(sourcemaps.write(sourcemapdir))
			.pipe(cssCopyAssets(settings.assets))
			.pipe(gulp.dest(outputdir))
	}

	// do something before build
	if(typeof options.before === 'function') {
		options.before(settings)
	}

    if(options.sourcemap) {
        let stream = options.minify ? HasSourceMapHasMinify() : HasSourceMapNoMinify()
		return stream.on('end', () => {
			if(typeof options.after === 'function') {
				options.after()
			}
		})
    }
	else {
		let stream = options.minify ? NoSourceMapHasMinify() : NoSourceMapNoMinify()
		return stream.on('end', () => {
			if(typeof options.after === 'function') {
				options.after()
			}
		})
	}
}
