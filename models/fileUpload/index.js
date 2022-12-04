const mongoose = require('mongoose')
const { Schema } = mongoose

const schema = new Schema({
    key: {
        type: String,
        require: true,
        unique: true,
    },
    fileName: {
        type: String,
        require: true,
        unique: true,
    },
    type: String,
	tree: Object,
    insert: Object,
    modify: Object
})

module.exports = mongoose.model('fileupload', schema)