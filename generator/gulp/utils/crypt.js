import crypto from 'crypto'

export function md5(content, length = 32) {
    var hash = crypto.createHash('md5')
    hash.update(content)
    var hex = hash.digest('hex')
    return hex.substr((32-length)/2, length)
}
