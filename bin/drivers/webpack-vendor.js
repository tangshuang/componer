import path from 'path'
import webpackConfig from './webpack.config'
import {camel} from '../utils/convert'

import extend from 'extend'
import webpack from 'webpack'


/**
* build vendors
* @param array vendors: e.g. ['jquery', 'underscore']
* @param string to: output vendor lib file, absolute path
* @param object options: {
    boolean sourcemap: whether to use sourcemap,
    boolean minfiy: whether to minify output file,
}
* @param object settings: settings of DllPlugin
* @return object: the same with settings of DllPlugin, useful for DllReferencePlugin
*/

export default function(vendors, to, options = {}, settings = {}) {
    var tmpdir = path.dirname(to)
    var filename = path.basename(to)
    var name = path.basename(to, '.js')

    var defaults = {
        path: to + '.json',
        name: camel(name, true) + 'Vendors',
        context: tmpdir,
    }

    settings = extend(true, defaults, settings)

    var config = {
        entry: {
            vendor: vendors,
        },
        output: {
            path: tmpdir,
            filename,
            library: settings.name,
            sourceMapFilename: filename + '.map',
        },
        plugins: [
            new webpack.DllPlugin(settings),
        ],
    }

    if(options.sourcemap) {
        settings.devtool = options.sourcemap === true ? 'source-map' : options.sourcemap
    }

    if(options.minify) {
        config.plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                minimize: true,
            })
        )
    }

    webpack(webpackConfig(config)).run((error, handle) => {})

    return settings
}
