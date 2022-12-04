const mongoose = require('mongoose')

const schema = {
	index: Number,
	userInfo: Object,
	content: Object,
	time: String
}

module.exports = mongoose.model('chat', schema);