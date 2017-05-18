import path from 'path'

const cwd = process.cwd()

export var webpack = {
    resolveLoader: {
        root: [
            path.resolve(cwd, 'node_modules'),
            path.resolve(__dirname, '../node_modules'),
        ],
    },
    resolve: {
        root: [
            cwd,
            path.resolve(__dirname, '..'),
        ],
    },
    babel: {
        extends: path.resolve(__dirname, '../.babelrc'),
    },
}
