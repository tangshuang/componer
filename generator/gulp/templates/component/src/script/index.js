export default class {{ComponoutName}} {
    constructor(options) {
        this.options = options
    }
    get(key) {
        return this[key]
    }
    set(key, value) {
        this[key] = value
    }
    toString() {
        return '{{ComponoutName}}'
    }
}
