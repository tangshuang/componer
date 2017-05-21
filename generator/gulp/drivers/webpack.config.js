import extend from 'extend'
import WebPackPluginBower from 'bower-webpack-plugin'
import Bufferify from 'webpack-bufferify'

class WebPackPluginCMD extends Bufferify {
    process(content, file, assets, compilation) {
        if(compilation.options.output.libraryTarget === 'umd') {
            content = content
                .replace("typeof define === 'function' && define.amd", "typeof define === 'function' && define.amd && define.cmd")
                .replace('"function"==typeof define&&define.amd', '"function"==typeof define&&define.amd&&define.cmd')
        }
        return content
    }
}

export function merge(defaults, settings) {
    var loaders = settings.module && settings.module.loaders
    var modulesDirectories = settings.resolve && settings.resolve.modulesDirectories
    var externals = settings.externals
    var plugins = settings.plugins

    if(loaders) {
        delete settings.module.loaders
        // merge exists loaders
        let loaderNames = loaders.map(item => item.loader)
        let defaultLoaders = defaults.module.loaders
        defaultLoaders.forEach((item, i) => {
            let loader = item.loader
            let i = loaderNames.indexOf(loader)
            if(i > -1) {
                extend(true, item, loaders[i])
                loaders[i] = null
            }
        })
        // concat other loaders
        loaders = loaders.map(item => !!item)
        defaults.module.loaders = defaultLoaders.concat(loaders)
    }

    if(modulesDirectories) {
        delete settings.resolve.modulesDirectories
        defaults.resolve.modulesDirectories = defaults.resolve.modulesDirectories.concat(modulesDirectories)
    }

    if(externals) {
        delete settings.externals
        defaults.externals = defaults.externals.concat(externals)
    }

    if(plugins) {
        delete settings.plugins
        defaults.plugins = defaults.plugins.concat(plugins)
    }
    return extend(true, defaults, settings)
}

export function config(settings) {
    var defaults = {
        output: {
            libraryTarget: 'umd',
        },
        module: {
            loaders: [
                {
        			test: /\.js$/,
        			loader: 'babel-loader',
                    // query: {
                    //     presets: ['es2015'],
                    // },
        		},
        		{
        			test: /^(?:(?!http).)*\.scss$/,
        			loader: 'style-loader!css-loader!sass-loader',
        		},
        		{
        			test: /^(?:(?!http).)*\.css$/,
        			loader: 'style-loader!css-loader',
        		},
        		{
        			test: /\.jpeg$|\.jpg|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        			loader: 'file-loader',
                    query: {
                        name: '[hash:16].[ext]',
                        outputPath: 'dist/font/',
                        publicPath: url => url.replace('dist/font/', '../font/'),
                    },
        		},
        		{
        			test: /\.svg$/,
        			loader: 'url-loader',
        			query: {
        				limit: 15000,
        				mimetype: 'image/svg+xml',
        			},
        		},
        		{
        			test: /\.html$/,
        			loader: 'html-loader',
        			query: {
        				attrs: 'img:src input:src',
        			},
        		},
        		{
        			test: /\.json$/,
        			loader: 'json-loader',
        		},
            ],
        },
        resolve: {
            modulesDirectories: [
                'node_modules',
                'componouts',
            ],
        },
        externals: [],
        plugins: [
            new WebPackPluginBower({
    			modulesDirectories: 'bower_components',
    			searchResolveModulesDirectories: false,
    			includes: /.*\.js/,
    		}),
    		new WebPackPluginCMD(),
        ],
    }
    return merge(defaults, settings)
}

export function config2(settings) {
    var loaders = settings.module && settings.module.loaders
    var modulesDirectories = settings.resolve && settings.resolve.modulesDirectories
    var resolveRoot = settings.resolve && settings.resolve.root
    var resolveLoaderRoot = settings.resolve && settings.resolveLoader.root
    var preLoaders = settings.module && settings.module.preLoaders

    delete settings.module.loaders
    settings.module.rules = loaders

    if(modulesDirectories) {
        delete settings.resolve.modulesDirectories
        settings.resolve.modules = modulesDirectories
    }

    if(resolveRoot) {
        delete settings.resolve.root
        modulesDirectories.unshift(resolveRoot)
    }

    if(resolveLoaderRoot) {
        delete settings.resolveLoader.root
        settings.resolveLoader.modules = resolveLoaderRoot
    }

    if(preLoaders) {
        delete settings.module.preLoaders
        preLoaders.forEach(item => item.enforce = 'pre')
        settings.module.rules = preLoaders.concat(loaders)
    }

    settings.module.rules.forEach(item => {
        let query = item.query
        if(query) {
            delete item.query
            item.options = query
        }
        // if(item.loader === 'babel-loader') {
        //     let presets = item.options.presets
        //     item.options.presets = presets.map(item => item === 'es2015' ? ['es2015', {modules: false}] : item)
        // }
    })

    return settings
}

export default function(settings) {
    var info = require(__dirname + '/../../node_modules/webpack/package.json')
    var version = info.version
    var results = config(settings)
    if(version >= 2) {
        config2(results)
    }
    return results
}
