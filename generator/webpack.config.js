import path from 'path'
import webpack from 'webpack'
import extend from 'extend'
import BowerResolvePlugin from 'bower-resolve-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import SassModuleImporter from 'sass-module-importer'

export default (env, config = {}, options = {}) => {
    let name = options.name
    let hash = options.hash
    let output = options.output
    let filename = hash ? name + '.[chunkhash:8]' : name

    let defaults = {
        output: {
            filename: 'dist/js/' + filename + '.js',
            libraryTarget: 'umd',
            sourceMapFilename: '[file].map',
        },
        devtool: 'source-map',
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    loader: 'babel-loader',
                    options: {
                        presets: [['es2015', {modules: false}]],
                    },
                },
                {
                    test: /\.scss$/,
                    use: ExtractTextPlugin.extract({
                        use: [
                            {
                                loader: 'css-loader',
                                options: {
                                    sourceMap: true,
                                },
                            },
                            {
                                loader: 'resolve-url-loader',
                                options: {
                                    sourceMap: true,
                                    keepQuery: true,
                                },
                            },
                            {
                                loader: 'sass-loader',
                                options: {
                                    sourceMap: true,
                                    importer: SassModuleImporter(),
                                },
                            },
                        ],
                        fallback: 'style-loader',
                    }),
                },
                {
                    test: /\.woff2?$|\.(ttf|eot)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[hash:16].[ext]',
                        outputPath: 'dist/font/',
                        publicPath: url => url.replace('dist/font/', '../font/'),
                    },
                },
                {
                    test: /\.(svg|png|jpg|jpeg|gif)$/,
                    loader: 'file-loader',
                    options: {
                        name: '[hash:16].[ext]',
                        outputPath: 'dist/img/',
                        publicPath: url => url.replace('dist/img/', '../img/'),
                    },
                },
                {
  			        test: /\.html$/,
  			        loader: 'html-loader',
  			        query: {
                        attrs: 'img:src input:src',
  			        },
  		        },
            ],
        },
        resolve: {
            plugins: [
                new BowerResolvePlugin(),
            ],
            modules: [
                'node_modules',
                'bower_components',
            ],
            descriptionFiles: [
                'package.json',
                'bower.json',
            ],
            mainFields: [
                'main',
                'browser',
            ],
        },
        plugins: [
            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
            }),
            new ExtractTextPlugin({
                filename: 'dist/css/' + filename + '.css',
                allChunks: true,
            }),
        ],
    }

    let settings = extends(true, {}, config, defaults, options)

    // if build production
    if(env === 'production') {
        // chunks
        let chunks = [name + '-manifest', name + '-vendors', name]
        // delete sourcemap
        delete settings.output.sourceMapFilename
        delete settings.devtool
        // add plugins
        settings.plugins = settings.plugins.concat([
            new webpack.optimize.CommonsChunkPlugin({
                name: chunks[1],
                minChunks: (mod, count) => {
                    let resource = mod.resource
                    if(resource && (/^.*\.(css|scss)$/).test(resource)) {
                        return false
                    }
                    let context = mod.context
                    if(!context) return false
                    if(context.indexOf('node_modules') === -1 && context.indexOf('bower_components') === -1) return false
                    return true
                },
            }),
            new webpack.optimize.CommonsChunkPlugin({
                name: chunks[0],
            }),
            new webpack.optimize.UglifyJsPlugin({
                minimize: true,
                comments: false,
                sourceMap: true,
            }),
            new OptimizeCssAssetsPlugin({
                cssProcessorOptions: {
                    map: {
                        inline: false,
                    },
                    discardComments: {
                        remove: comment => comment[0] !== '#',
                    },
                },
            }),
        ])
    }
    // html inject
    if(options.html) {
        settings.plugins = settings.plugins.concat([
            new HtmlWebpackPlugin({
                template: options.html,
                filename: path.join(output, 'index.html'),
                chunksSortMode: (chunk1, chunk2) => {
                    let order1 = chunks.indexOf(chunk1.names[0])
                    let order2 = chunks.indexOf(chunk2.names[0])
                    return order1 > order2 ? 1 : order1 < order2 ? -1 : 0
                },
            }),
        ])
    }

    return config
}
