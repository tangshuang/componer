import webpackVendor from './webpack-vendor'
import webpackStream from './webpack-stream'
import concat from 'pipe-concat'
import path from 'path'
import {camelName} from '../utils/convert-name'
import extend from 'extend'
import fs from 'fs'

/**
@desc build js by webpack
@param string from: entry file absolute path
@param string to: output file absolute path
@param object options: {
    boolean sourcemap: whether to use sourcemap,
    boolean minify: whether to minify code, the minify codes are in another .min file
}
@param object settings: webpack settings
@return streaming
*/

export default function(from, to, options = {}, settings  = {}) {
    var outputdir = path.dirname(to)
    var filename = path.basename(to)
    var name = path.basename(to, '.js')
    var streams = []

    if(options.externals === false) {
        settings.externals = getExternals()
    }

    var opts = extend(true, {}, options, {
        minify: false,
    })
    var sets = {
        name: camelName(name, true) + 'Vendors',
    }

    var vendors = options.vendors || []

    if(vendors.length > 0) {
        opts.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.js', opts, sets)
    }
    var stream1 = webpackStream(form, to, opts, settings)
    streams.push(stream1)

    if(options.minify) {
        opts.minify = true
        if(vendors.length > 0) {
            opts.vendors = webpackVendor(vendors, outputdir + '/' + name + '.vendors.min.js', opts, sets)
        }
        let stream2 = webpackStream(form, outputdir + '/' + name + '.min.js', opts, settings)
        streams.push(stream2)
    }

    return concat(streams)
}

function getExternals() {
    let packages = {}
    let add = name => {
        if(name.indexOf('.') === 0) return
        packages[name] = name
    }

    let node_modules = __dirname + '/../../node_modules'
    fs.readdirSync(node_modules).forEach(add)

    let bower_components = __dirname + '/../../bower_components'
    if(fs.existsSync(bower_components)) fs.readdirSync(bower_components).forEach(add)

    let componouts = __dirname + '/../../componouts'
    fs.readdirSync(componouts).forEach(name => {
        if(fs.existsSync(componouts + '/' + name + '/package.json')) {
            add(name)
        }
    })

    return packages
}
