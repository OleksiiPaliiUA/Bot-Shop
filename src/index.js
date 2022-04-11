const TelegramBot = require('node-telegram-bot-api')

const config = require('./config.js')
const helper = require('./helper.js')
const names = require('./dictionary.json')

const mongoose = require('mongoose')
const fetch = require('node-fetch')
const path = require('path')
const fs = require("fs");

class Connection {
    id
    name = '-1'
    stage = '-1'
    price = -1
    description = '-1'
    article = -1
    available = -1
    photo_availability = false
    msgid = -1
    catalogid = -1
    lang = 'ru'
    constructor(id) {
        this.id = id
        this.name = '-1'
        this.stage = '-1'
        this.price = -1
        this.description = '-1'
        this.article = -1
        this.available = -1
        this.photo_availability = false
        this.msgid = -1
        this.catalogid = -1
        this.lang = 'ru'
    }
}

mongoose.Promise = global.Promise
process.env["NTBA_FIX_350"] = 1

const admin_bot = new TelegramBot(config.BOT_ADMIN_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
})

helper.logStart()

mongoose.connect(config.DB_TOKEN)
    .then(() => console.log('MongoDB has connected...'))
    .catch(e => console.log(e))

require('../db_models/goods.model')
require('../db_models/accounts.model')

let Connections = []

function GetArrayNumber (id){
    for(let i = 0; i < Connections.length; i++){
        if(id === Connections[i].id) {
            return i
        }
    }
}
/*function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}*/

const Goods = mongoose.model('goods')
const Accounts = mongoose.model('accounts')

let GoodsCount

admin_bot.on("polling_error", console.log)

admin_bot.on('callback_query', async query => {
    if(Connections[GetArrayNumber(query.message.chat.id)] === undefined) {
        let tmp = new Connection(query.message.chat.id);
        Connections.push(tmp)
    }
    switch(query.data) {
        case 'RemoveGoodByArticleAccept':
            GoodsCount = await Goods.count({});
            Goods.findOneAndDelete({ Article: Connections[GetArrayNumber(query.message.chat.id)].article})
                .then(goods => {
                    for(let i = goods.ID+1; i < GoodsCount; i++){
                        Goods.findOneAndUpdate({ID: i},{
                            ID: i - 1
                        }, function(err){
                            if(err) {
                                console.log(err)
                            }
                        })
                    }
                    if(goods.Photo_Availability === true) {
                        fs.unlink(`images/${goods.Article}.jpg`, function(err){
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                    admin_bot.sendMessage(query.message.chat.id, `<b>Товар №${goods.Article} был удалён! </b>`, helper.MainMenu)
                    console.log(`Good ${goods.Article} was deleted!`)
                    admin_bot.deleteMessage(query.message.chat.id, Connections[GetArrayNumber(query.message.chat.id)].msgid)
                    Connections[GetArrayNumber(query.message.chat.id)].article = -1
                })
            break
        case 'RemoveGoodByArticleRefuse':
            await admin_bot.sendMessage(query.message.chat.id, `<b>Удаление товара №${Connections[GetArrayNumber(query.message.chat.id)].article} было отменено! </b>`, helper.MainMenu)
            await admin_bot.deleteMessage(query.message.chat.id, Connections[GetArrayNumber(query.message.chat.id)].msgid)
            Connections[GetArrayNumber(query.message.chat.id)].article = '-1'
            break
        case 'Photo_Availability_false':
            await admin_bot.sendMessage(query.message.chat.id, names.Available, {parse_mode: 'HTML'})
            Connections[GetArrayNumber(query.message.chat.id)].stage = 'Available'
            break
        case 'Forward':
            Goods.findOne({ ID: (Connections[GetArrayNumber(query.message.chat.id)].catalogid+1) })
                .then(async goods => {
                    GoodsCount = await Goods.count({});
                    if(goods.Photo_Availability === true) {
                        await admin_bot.editMessageMedia({
                            type: 'photo',
                            media: `attach://images/${goods.Article}.jpg`,
                            caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                            parse_mode: 'HTML'
                        }, {
                            chat_id: query.message.chat.id,
                            message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                        })
                        if(GoodsCount-2 === Connections[GetArrayNumber(query.message.chat.id)].catalogid) {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.BackwardKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                        else {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.CatalogKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                    }
                    else {
                        await admin_bot.editMessageMedia({
                            type: 'photo',
                            media: `attach://images/0.jpg`,
                            caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                            parse_mode: 'HTML'
                        }, {
                            chat_id: query.message.chat.id,
                            message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                        })
                        if(GoodsCount-2 === Connections[GetArrayNumber(query.message.chat.id)].catalogid) {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.BackwardKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                        else {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.CatalogKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                    }
                    Connections[GetArrayNumber(query.message.chat.id)].catalogid++
                })
            break
        case 'Backward':
            Goods.findOne({ ID: (Connections[GetArrayNumber(query.message.chat.id)].catalogid-1) })
                .then(async goods => {
                    GoodsCount = await Goods.count({})
                    if(goods.Photo_Availability === true) {
                        await admin_bot.editMessageMedia({
                            type: 'photo',
                            media: `attach://images/${goods.Article}.jpg`,
                            caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                            parse_mode: 'HTML',
                        }, {
                            chat_id: query.message.chat.id,
                            message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                        })
                        if(Connections[GetArrayNumber(query.message.chat.id)].catalogid === 1) {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.ForwardKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                        else {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.CatalogKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                    }
                    else {
                        await admin_bot.editMessageMedia({
                            type: 'photo',
                            media: `attach://images/0.jpg`,
                            caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                            parse_mode: 'HTML'
                        }, {
                            chat_id: query.message.chat.id,
                            message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                        })
                        if(Connections[GetArrayNumber(query.message.chat.id)].catalogid === 1) {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.ForwardKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                        else {
                            await admin_bot.editMessageReplyMarkup({
                                inline_keyboard: helper.CatalogKeyboard
                            }, {
                                chat_id: query.message.chat.id,
                                message_id: Connections[GetArrayNumber(query.message.chat.id)].msgid
                            })
                        }
                    }
                    Connections[GetArrayNumber(query.message.chat.id)].catalogid--
                })
            break
        case 'BackToMenu':
            if(Connections[GetArrayNumber(query.message.chat.id)] === undefined) {
                let tmp = new Connection(query.message.chat.id);
                Connections.push(tmp)
            }
            else {
                if(Connections[GetArrayNumber(query.message.chat.id)].msgid !== -1){
                    await admin_bot.deleteMessage(query.message.chat.id, Connections[GetArrayNumber(query.message.chat.id)].msgid)
                }
                Connections[GetArrayNumber(query.message.chat.id)].stage = '-1'
                Connections[GetArrayNumber(query.message.chat.id)].article = Number(-1)
                Connections[GetArrayNumber(query.message.chat.id)].name = '-1'
                Connections[GetArrayNumber(query.message.chat.id)].price = Number(-1)
                Connections[GetArrayNumber(query.message.chat.id)].available = Number(-1)
                Connections[GetArrayNumber(query.message.chat.id)].photo_availability = false
                Connections[GetArrayNumber(query.message.chat.id)].msgid = Number(-1)
                Connections[GetArrayNumber(query.message.chat.id)].id = Number(-1)
            }
            await admin_bot.sendMessage(query.message.chat.id, `<i>Что вас интересует?</i>`, helper.MainMenu)
            break
        case 'EditGoodArticle':
            await admin_bot.sendMessage(query.message.chat.id, names.Article, {parse_mode: 'HTML'})
            Connections[GetArrayNumber(query.message.chat.id)].stage = 'EditArticle'
            break
        case 'EditGoodName':
            await admin_bot.sendMessage(query.message.chat.id, names.GoodName, {parse_mode: 'HTML'})
            Connections[GetArrayNumber(query.message.chat.id)].stage = 'EditName'
            break
    }
})


admin_bot.on('text', async msg => {
    GoodsCount = await Goods.count({});
    if(Connections[GetArrayNumber(msg.chat.id)] === undefined) {
        let tmp = new Connection(msg.chat.id)
        Connections.push(tmp)
    }
    if(msg.text === names.Refuse){
        Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
        Connections[GetArrayNumber(msg.chat.id)].article = Number(-1)
        Connections[GetArrayNumber(msg.chat.id)].name = '-1'
        Connections[GetArrayNumber(msg.chat.id)].price = Number(-1)
        Connections[GetArrayNumber(msg.chat.id)].available = Number(-1)
        Connections[GetArrayNumber(msg.chat.id)].photo_availability = false
        Connections[GetArrayNumber(msg.chat.id)].msgid = Number(-1)
        Connections[GetArrayNumber(msg.chat.id)].id = Number(-1)
        await admin_bot.sendMessage(msg.chat.id, names.ActionRefuse, helper.MainMenu)
    }
    if(msg.text === '/start'){
        let sender = msg.from.username ? msg.from.username : msg.from.first_name
        if(Connections[GetArrayNumber(msg.chat.id)] === undefined) {
            let tmp = new Connection(msg.chat.id);
            Connections.push(tmp)
        }
        else {
            Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
            Connections[GetArrayNumber(msg.chat.id)].article = Number(-1)
            Connections[GetArrayNumber(msg.chat.id)].name = '-1'
            Connections[GetArrayNumber(msg.chat.id)].price = Number(-1)
            Connections[GetArrayNumber(msg.chat.id)].available = Number(-1)
            Connections[GetArrayNumber(msg.chat.id)].photo_availability = false
            Connections[GetArrayNumber(msg.chat.id)].msgid = Number(-1)
            Connections[GetArrayNumber(msg.chat.id)].id = Number(-1)
        }
        await admin_bot.sendMessage(msg.chat.id, `<strong>Здравствуйте, <u>${sender}</u>\nВас приветствует бот для администрирования своим магазином в телеграмме</strong>\n<i>Что вас интересует?</i>`, helper.MainMenu)
    }
    if(Connections[GetArrayNumber(msg.chat.id)] !== undefined){
        switch(Connections[GetArrayNumber(msg.chat.id)].stage) {
            case 'FindByArticle':
                if(!isNaN(Number(msg.text))){
                    await Goods.findOne({ Article: msg.text })
                        .then(goods => {
                            if(goods){
                                if(goods.Photo_Availability === true){
                                    admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            one_time_keyboard: true,
                                            resize_keyboard: true,
                                            keyboard: helper.MainKeyboard
                                        }
                                    })
                                }
                                else {
                                    admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            one_time_keyboard: true,
                                            resize_keyboard: true,
                                            keyboard: helper.MainKeyboard
                                        }
                                    })
                                }
                                Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                            }
                            else {
                                admin_bot.sendMessage(msg.chat.id, names.GoodIsEmpty, {parse_mode: "HTML"})
                            }

                        })
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'RemoveGoodByArticle':
                if(!isNaN(Number(msg.text))){
                    Connections[GetArrayNumber(msg.chat.id)].article = Number(msg.text)
                    await Goods.findOne({ Article: Connections[GetArrayNumber(msg.chat.id)].article })
                        .then(goods => {
                            if(goods){
                                if(goods.Photo_Availability === true){
                                    admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n<u>Вы уверены что хотите удалить товар?</u></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            inline_keyboard: helper.RemoveGoodKeyboard
                                        }
                                    }).then((data) => {
                                        Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                    })
                                }
                                else {
                                    admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n<u>Вы уверены что хотите удалить товар?</u></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            inline_keyboard: helper.RemoveGoodKeyboard
                                        }
                                    }).then((data) => {
                                        Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                    })
                                }
                                Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                            }
                            else {
                                admin_bot.sendMessage(msg.chat.id, names.GoodIsEmpty, {parse_mode: "HTML"})
                            }
                        })
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'Available':
                if(!isNaN(Number(msg.text))){
                    Connections[GetArrayNumber(msg.chat.id)].available = Number(msg.text)
                    await admin_bot.sendMessage(msg.chat.id, `<b>Товар '${Connections[GetArrayNumber(msg.chat.id)].name}' [Art. ${Connections[GetArrayNumber(msg.chat.id)].article}] добавлен в базу! </b>`, {parse_mode: "HTML"})
                    GoodsCount = await Goods.count({});
                    let tmp = new Goods({
                        ID: GoodsCount,
                        Article: Connections[GetArrayNumber(msg.chat.id)].article,
                        Description: Connections[GetArrayNumber(msg.chat.id)].description,
                        Good_name: Connections[GetArrayNumber(msg.chat.id)].name,
                        Price: Connections[GetArrayNumber(msg.chat.id)].price,
                        Available: Connections[GetArrayNumber(msg.chat.id)].available,
                        Photo_Availability: Connections[GetArrayNumber(msg.chat.id)].photo_availability
                    })
                    tmp.save()
                        .then(() => console.log(`Good ${Connections[GetArrayNumber(msg.chat.id)].article} was added!`))
                        .catch(e => console.log(e))
                    if(Connections[GetArrayNumber(msg.chat.id)].photo_availability === true){
                        await admin_bot.sendPhoto(msg.chat.id, `images/${Connections[GetArrayNumber(msg.chat.id)].article}.jpg`, {
                            caption: `<b>Артикул: <i>${Connections[GetArrayNumber(msg.chat.id)].article}</i>\nНазвание товара: <i>${Connections[GetArrayNumber(msg.chat.id)].name}</i>\nОписание: <i>${Connections[GetArrayNumber(msg.chat.id)].description}</i>\nЦена: <i>${Connections[GetArrayNumber(msg.chat.id)].price} грн.</i>\nВ наличии: <i>${Connections[GetArrayNumber(msg.chat.id)].available} шт.</i></b>`,
                            parse_mode: 'HTML',
                            reply_markup: {
                                one_time_keyboard: true,
                                resize_keyboard: true,
                                keyboard: helper.MainKeyboard
                            }
                        })
                    }
                    else {
                        await admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                            caption: `<b>Артикул: <i>${Connections[GetArrayNumber(msg.chat.id)].article}</i>\nНазвание товара: <i>${Connections[GetArrayNumber(msg.chat.id)].name}</i>\nОписание: <i>${Connections[GetArrayNumber(msg.chat.id)].description}</i>\nЦена: <i>${Connections[GetArrayNumber(msg.chat.id)].price} грн.</i>\nВ наличии: <i>${Connections[GetArrayNumber(msg.chat.id)].available} шт.</i></b>`,
                            parse_mode: 'HTML',
                            reply_markup: {
                                one_time_keyboard: true,
                                resize_keyboard: true,
                                keyboard: helper.MainKeyboard
                            }
                        })
                    }
                    Connections[GetArrayNumber(msg.chat.id)].article = -1
                    Connections[GetArrayNumber(msg.chat.id)].name = '-1'
                    Connections[GetArrayNumber(msg.chat.id)].price = -1
                    Connections[GetArrayNumber(msg.chat.id)].available = -1
                    Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                    Connections[GetArrayNumber(msg.chat.id)].photo_availability = false
                    Connections[GetArrayNumber(msg.chat.id)].msgid = Number(-1)
                    Connections[GetArrayNumber(msg.chat.id)].id = Number(-1)
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.AvailableIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'Description':
                Connections[GetArrayNumber(msg.chat.id)].description = msg.text
                await admin_bot.sendMessage(msg.chat.id, names.Photo, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: helper.WithoutPhotoKeyboard
                    }
                })
                Connections[GetArrayNumber(msg.chat.id)].stage = 'Photo'
                break
            case 'Price':
                if(!isNaN(Number(msg.text))){
                    Connections[GetArrayNumber(msg.chat.id)].price = Number(msg.text)
                    await admin_bot.sendMessage(msg.chat.id, names.Description, {parse_mode: 'HTML'})
                    Connections[GetArrayNumber(msg.chat.id)].stage = 'Description'
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.PriceIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'Name':
                Connections[GetArrayNumber(msg.chat.id)].name = msg.text
                await admin_bot.sendMessage(msg.chat.id, names.Price, {parse_mode: 'HTML'})
                Connections[GetArrayNumber(msg.chat.id)].stage = 'Price'
                break
            case 'Article':
                if(!isNaN(Number(msg.text))){
                    if(msg.text < 1){
                        await admin_bot.sendMessage(msg.chat.id, names.ArticleLessThan1, {parse_mode: "HTML"})
                    }
                    else {
                        await Goods.findOne({ Article: msg.text })
                            .then(async (goods) => {
                                if(goods) {
                                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsAlreadyExists, {parse_mode: 'HTML'})
                                }
                                else {
                                    Connections[GetArrayNumber(msg.chat.id)].article = Number(msg.text)
                                    await admin_bot.sendMessage(msg.chat.id, names.GoodName, {parse_mode: 'HTML'})
                                    Connections[GetArrayNumber(msg.chat.id)].stage = 'Name'
                                }
                            })
                    }
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'EditGood':
                if(!isNaN(Number(msg.text))){
                    await Goods.findOne({ Article: msg.text })
                        .then(goods => {
                            if(goods){
                                Connections[GetArrayNumber(msg.chat.id)].article = Number(msg.text)
                                if(goods.Photo_Availability === true){
                                    admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Что вы желаете изменить?</i></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            one_time_keyboard: true,
                                            resize_keyboard: true,
                                            inline_keyboard: helper.EditKeyboard
                                        }
                                    }).then((data) => {
                                        Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                    })
                                }
                                else {
                                    admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Что вы желаете изменить?</i></b>`,
                                        parse_mode: 'HTML',
                                        reply_markup: {
                                            one_time_keyboard: true,
                                            resize_keyboard: true,
                                            inline_keyboard: helper.EditKeyboard
                                        }
                                    }).then((data) => {
                                        Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                    })
                                }
                                Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                            }
                            else {
                                admin_bot.sendMessage(msg.chat.id, names.GoodIsEmpty, {parse_mode: "HTML"})
                            }

                        })
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'EditArticle':
                if(!isNaN(Number(msg.text))){
                    if(Number(msg.text) < 1){
                        await admin_bot.sendMessage(msg.chat.id, names.ArticleLessThan1, {parse_mode: "HTML"})
                    }
                    else {
                        await Goods.findOne({ Article: msg.text })
                            .then(async (goodsfirst) => {
                                if(goodsfirst) {
                                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsAlreadyExists, {parse_mode: 'HTML'})
                                }
                                else {
                                    await admin_bot.deleteMessage(msg.chat.id, Connections[GetArrayNumber(msg.chat.id)].msgid)
                                    await Goods.findOneAndUpdate({ Article: Connections[GetArrayNumber(msg.chat.id)].article },{Article: msg.text})
                                    await Goods.findOne({ Article: msg.text })
                                        .then(async (goods) => {
                                            if(goods){
                                                if(goods.Photo_Availability === true){
                                                    await admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Успешно отредактировано!</i></b>`,
                                                        parse_mode: 'HTML',
                                                        reply_markup: {
                                                            one_time_keyboard: true,
                                                            resize_keyboard: true,
                                                            keyboard: helper.MainKeyboard
                                                        }
                                                    })
                                                }
                                                else {
                                                    await admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                                        caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Успешно отредактировано!</i></b>`,
                                                        parse_mode: 'HTML',
                                                        reply_markup: {
                                                            one_time_keyboard: true,
                                                            resize_keyboard: true,
                                                            keyboard: helper.MainKeyboard
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    Connections[GetArrayNumber(msg.chat.id)].msgid = -1
                                    Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                                    Connections[GetArrayNumber(msg.chat.id)].article = -1
                                }
                            })
                    }
                }
                else {
                    await admin_bot.sendMessage(msg.chat.id, names.ArticleIsNaN, {parse_mode: "HTML"})
                }
                break
            case 'EditName':
                await admin_bot.deleteMessage(msg.chat.id, Connections[GetArrayNumber(msg.chat.id)].msgid)
                await Goods.findOneAndUpdate({ Article: Connections[GetArrayNumber(msg.chat.id)].article },{Good_name: msg.text})
                await Goods.findOne({ Article: Connections[GetArrayNumber(msg.chat.id)].article })
                    .then(async (goods) => {
                        if(goods){
                            if(goods.Photo_Availability === true){
                                await admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Успешно отредактировано!</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        one_time_keyboard: true,
                                        resize_keyboard: true,
                                        keyboard: helper.MainKeyboard
                                    }
                                })
                            }
                            else {
                                await admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i>\n\n<i>Успешно отредактировано!</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        one_time_keyboard: true,
                                        resize_keyboard: true,
                                        keyboard: helper.MainKeyboard
                                    }
                                })
                            }
                        }
                    })
                Connections[GetArrayNumber(msg.chat.id)].msgid = -1
                Connections[GetArrayNumber(msg.chat.id)].stage = '-1'
                Connections[GetArrayNumber(msg.chat.id)].article = -1
                break
        }
    }
    switch(msg.text) {
        case names.AddGood:
            Connections[GetArrayNumber(msg.chat.id)].stage = 'Article'
            await admin_bot.sendMessage(msg.chat.id, names.Article, helper.RefuseForm)
            break
        case names.CatalogGood:
            if(GoodsCount === 0){
                await admin_bot.sendMessage(msg.chat.id, names.NoGoods, helper.MainMenu)
            }
            else {
                await admin_bot.sendMessage(msg.chat.id, `<b>Всего товаров: ${GoodsCount}</b>`, {parse_mode:'HTML'})
                Connections[GetArrayNumber(msg.chat.id)].catalogid = 0
                Goods.findOne({ ID: Connections[GetArrayNumber(msg.chat.id)].catalogid })
                    .then(goods => {
                        if(GoodsCount === 1){
                            if(goods.Photo_Availability === true) {
                                admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        one_time_keyboard: false,
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: names.BackToMenu,
                                                    callback_data: 'BackToMenu'
                                                }
                                            ]
                                        ]
                                    }
                                }).then((data) => {
                                    Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                })
                            }
                            else {
                                admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: names.BackToMenu,
                                                    callback_data: 'BackToMenu'
                                                }
                                            ]
                                        ]
                                    }
                                }).then((data) => {
                                    Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                })
                            }
                        }
                        else {
                            if(goods.Photo_Availability === true) {
                                admin_bot.sendPhoto(msg.chat.id, `images/${goods.Article}.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        one_time_keyboard: false,
                                        inline_keyboard: helper.ForwardKeyboard
                                    }
                                }).then((data) => {
                                    Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                })
                            }
                            else {
                                admin_bot.sendPhoto(msg.chat.id, `images/0.jpg`, {
                                    caption: `<b>Артикул: <i>${goods.Article}</i>\nНазвание товара: <i>${goods.Good_name}</i>\nОписание: <i>${goods.Description}</i>\nЦена: <i>${goods.Price} грн.</i>\nВ наличии: <i>${goods.Available} шт.</i></b>`,
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        inline_keyboard: helper.ForwardKeyboard
                                    }
                                }).then((data) => {
                                    Connections[GetArrayNumber(msg.chat.id)].msgid = data.message_id
                                })
                            }
                        }
                    })
            }
            break
        case names.FindGood:
            if(GoodsCount === 0) {
                await admin_bot.sendMessage(msg.chat.id, names.NoGoods, helper.MainMenu)
            }
            else {
                Connections[GetArrayNumber(msg.chat.id)].stage = 'FindByArticle'
                await admin_bot.sendMessage(msg.chat.id, names.Article, helper.RefuseForm)
            }
            break
        case names.RemoveGood:
            if(GoodsCount === 0) {
                await admin_bot.sendMessage(msg.chat.id, '<b>Товаров нету! </b>', helper.MainMenu)
            }
            else {
                Connections[GetArrayNumber(msg.chat.id)].stage = 'RemoveGoodByArticle'
                await admin_bot.sendMessage(msg.chat.id, names.Article, helper.RefuseForm)
            }
            break
        case names.EditGood:
            if(GoodsCount === 0) {
                await admin_bot.sendMessage(msg.chat.id, names.NoGoods, helper.MainMenu)
            }
            else {
                Connections[GetArrayNumber(msg.chat.id)].stage = 'EditGood'
                await admin_bot.sendMessage(msg.chat.id, names.Article, helper.RefuseForm)
            }
            break
    }
})

admin_bot.on('photo', async (msg) => {
    if(Connections[GetArrayNumber(msg.chat.id)] === undefined) {
        let tmp = new Connection(msg.chat.id)
        Connections.push(tmp)
    }
    if(Connections[GetArrayNumber(msg.chat.id)].stage === 'Photo') {
        let fileId = msg.photo[msg.photo.length-1].file_id;
        let res = await fetch(`https://api.telegram.org/bot${config.BOT_ADMIN_TOKEN}/getFile?file_id=${fileId}`)
        let res2 = await res.json();
        let downloadURL = `https://api.telegram.org/file/bot${config.BOT_ADMIN_TOKEN}/${res2.result.file_path}`
        await helper.download(downloadURL, path.join('images', `${Connections[GetArrayNumber(msg.chat.id)].article}.jpg`), () => console.log(`Download photo ${fileId}.jpg!`))
        await admin_bot.sendMessage(msg.chat.id, names.Available, {parse_mode: 'HTML'})
        Connections[GetArrayNumber(msg.chat.id)].photo_availability = true
        Connections[GetArrayNumber(msg.chat.id)].stage = 'Available'
    }
})
