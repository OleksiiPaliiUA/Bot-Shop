const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AccountsSchema = new Schema({
    ID: {
        type: Number,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Username: {
        type: String,
        required: false
    },
    Phone_Number: {
        type: String,
        required: true
    }
}, {collection: 'accounts'})

mongoose.model('accounts', AccountsSchema)
