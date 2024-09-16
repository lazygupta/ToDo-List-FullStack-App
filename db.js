const mongoose = require('mongoose');

const Schema = mongoose.Schema

const ObjectId = mongoose.ObjectId

const users = new Schema({
    username: {type: String},
    password: String
})

const todo = new Schema({
    id: ObjectId,
    username: String,
    title: String,
    done: Boolean
})

const userModel = mongoose.model("users" , users)
const todoModel = mongoose.model("todo" , todo)

module.exports = {
    userModel,
    todoModel
}