const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GoodsSchema = new Schema({
    ID: {
        type: Number,
        required: true
    },
    Article: {
        type: Number,
        required: true
    },
    Good_name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    Available: {
        type: Number,
        required: true
    },
    Photo_Availability: {
        type: Boolean,
        required: true
    }
}, {collection: 'goods'})

mongoose.model('goods', GoodsSchema)
