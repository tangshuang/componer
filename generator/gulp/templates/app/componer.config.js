import webpack from 'webpack'
import fs from 'fs'
import path from 'path'
import webpackConfig from '../../gulp/drivers/webpack.config' //[ truthy componout relative path ]//

module.exports = {
	name: '{{componout-name}}',
	type: 'app',
	build: [
		{
			from: 'src/script/{{componout-name}}.js',
			to: 'dist/js/{{componout-name}}.js',
			driver: 'webpack',
			options: {
				minify: true,
				sourcemap: 'file',
				before: settings => {
					let dir = __dirname
					let bowerJson = path.join(dir, 'bower.json')
					let pkgJson = path.join(dir, 'package.json')
					let dist = path.join(dir, 'dist')

					let getDeps = function(pkgfile) {
						let deps = require(pkgfile).dependencies
						return Object.keys(deps)
					}
					let vendors = getDeps(bowerJson).concat(getDeps(pkgJson))

					if(vendors.length === 0) return
					// if there are some vendors, use DllPlugin to created vendors scripts file
					webpack(webpackConfig({
						entry: {
							vendor: vendors,
						},
						output: {
							path: dist,
							filename: '{{componout-name}}.vendor.js',
							library: '{{ComponoutName}}Vendor',
							sourceMapFilename: '{{componout-name}}.vendor.js.map',
						},
						devtool: 'source-map',
						plugins: [
							new webpack.DllPlugin({
								name: '{{ComponoutName}}Vendor',
								path: dist + '/{{componout-name}}.vendor.js.json',
								context: dist,
							}),
						],
					})).run((error, handle) => {})
					settings.plugins.push(
						new webpack.DllReferencePlugin({
							context: dist,
							manifest: require(dist + '/{{componout-name}}.vendor.js.json'),
						})
					)
				},
				after: () => {
					let vendorjson = dist + '/{{componout-name}}.vendor.js.json'
					if(fs.existsSync(vendorjson)) fs.unlink(vendorjson)
				},
			},
			settings: {
				output: {
					library: '{{componout-name}}',
				},
			},
		},
		{
			from: 'src/style/{{componout-name}}.scss',
			to: 'dist/css/{{componout-name}}.css',
			driver: 'sass',
			options: {
				minify: true,
				sourcemap: 'file',
			},
		},
	],
	preview: {
		index: 'preview/index.html',
		script: 'src/script/{{componout-name}}.js',
		style: 'src/style/{{componout-name}}.scss',
		server: 'preview/server.js',
		watchFiles: [
			'preview/index.html',
			'preview/{{componout-name}}.js',
			'preview/{{componout-name}}.scss',
			'src/**/*',
		],
	},
	test: {
		entry: 'test/specs/{{componout-name}}.js',
		reporters: 'test/reporters',
		debug: false,
		browsers: ['PhantomJS'],
	},
}
