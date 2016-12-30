import extend from "extend"
import webpack from "./webpack.config"

function karma(settings) {

    var defaults = {
        port: 9000 + parseInt(Math.random() * 1000),
        singleRun: true,
        frameworks: ["jasmine"],
        browsers: ["PhantomJS"],
        preprocessors: {},
        reporters: ["progress", "coverage", "html"],
        coverageReporter: {
            reporters: [],
        },
        htmlReporter: {
            outputDir: "",
            reportName: "",
            urlFriendlyName: true,
        },
        webpack: webpack({
            module: {
                preLoaders: [
                    {
                        test: /\.js$/, 
                        loader: "isparta",
                        exclude: /node_modules|bower_components/,
                    },
                ],
            },
        }),
        scssPreprocessor: {
            options: {
                sourceMap: true,
                includePaths: [],
            },
        },
        plugins: [],
    }

    if(typeof settings === "object") {
        settings = extend(true, {}, defaults, settings)
    }

    settings.coverageReporter.reporters.push({
        type: "text",
    })

    settings.plugins = settings.plugins.concat([
        require("karma-jasmine"),
        require("karma-phantomjs-launcher"),
        require("karma-chrome-launcher"),
        require("karma-firefox-launcher"),
        require("karma-coverage"),
        require("karma-webpack"),
        require("karma-scss-preprocessor"),
        require("karma-html-reporter"),
    ])

    settings.scssPreprocessor.options.includePaths.push("bower_components")

    return settings

}

export default karma
module.exports = karma
