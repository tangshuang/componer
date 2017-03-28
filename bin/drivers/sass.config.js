import moduleimport from 'sass-module-importer'
import extend from 'extend'

// look into https://github.com/sass/node-sass to find out options

export default function(settings) {
    var defaults = {
        importer: moduleimport()
    }
    settings = extend(true, defaults, settings)
    return settings
}
