import path from 'path'
import {merge} from 'webpack.config'

export default function(settings) {
    var cwd = process.cwd()
    var defaults = {
        module: {
            loaders: [
                {
        			test: /\.js$/,
        			loader: 'babel-loader',
                    query: {
                        extends: path.resolve(__dirname, '../../.babelrc'),
                    },
        		},
            ],
        },
        resolveLoader: {
            root: [
                path.resolve(cwd, 'node_modules'),
                path.resolve(__dirname, '../../node_modules'),
            ],
        },
        resolve: {
            root: [
                cwd,
                path.resolve(__dirname, '..'),
            ],
        },
    }
    return merge(defaults, settings)
}
