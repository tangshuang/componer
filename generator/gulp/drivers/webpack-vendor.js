import webpack from 'webpack'
import webpackConfig from './webpack.config'
import extend from 'extend'
import {camelName} from '../utils/convert-name'
import path from 'path'

/**
 * build vendors
 * @param array from: vendors, e.g. ['jquery', 'underscore']
 * @param string to: output vendor lib file, absolute path
 * @param object settings: settings of DllPlugin
 * @param object options: {
        boolean sourcemap: whether to use sourcemap
    }
 * @return object: the same with settings of DllPlugin, useful for DllReferencePlugin
 */

export default function({from, to, settings = {}, options = {}}) {
    var tmpdir = path.dirname(to)
    var name = path.basename(to, '.js')

    var defaults = {
        path: tmpdir + `/${name}.js.json`,
        name: camelName(name, true),
        context: tmpdir,
    }
    settings = extend(true, defaults, settings)

    var config = {
        entry: {
            vendor: from,
        },
        output: {
            path: tmpdir,
            filename: name + '.js',
            library: settings.name,
            sourceMapFilename: name + '.js.map',
        },
        devtool: 'source-map',
        plugins: [
            new webpack.DllPlugin(settings),
        ],
    }

    if(!options.sourcemap) {
        delete config.devtool
        delete config.output.sourceMapFilename
    }

    webpack(webpackConfig(config)).run((error, handle) => {})

    return settings
}
