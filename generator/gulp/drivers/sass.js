import sassStream from './sass-stream'
import concat from 'pipe-concat'

export default function(from, to, options = {}, settings = {}) {
    var outputdir = path.dirname(to)
    var name = path.basename(to, '.js')
    var streams = []

    var opts = {
        minify: false,
        sourcemap: options.sourcemap,
    }

    var stream1 = sassStream(from, to, opts, settings)
    streams.push(stream1)

    if(options.minify) {
        opts.minify = true
        var stream2 = sassStream(from, outputdir + '/' + name + '.min.css', opts, settings)
        streams.push(stream2)
    }

    return concat(streams)
}
