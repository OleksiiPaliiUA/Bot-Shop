const fs = require("fs");
const request = require('request')
const names = require('./dictionary.json')
const sharp = require('sharp')

function debug(obj = {}) {
    return JSON.stringify(obj, null, 4)
}
const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url).pipe(sharp().resize({width:1440, height:1080, fit: sharp.fit.contain})).pipe(fs.createWriteStream(path)).on('close', callback)
    })
}

const ForwardKeyboard  = [
    [
        {
            text: '➡',
            callback_data: 'Forward'
        }
    ],
    [
        {
            text: names.BackToMenu,
            callback_data: 'BackToMenu'
        }
    ]
]
const BackwardKeyboard = [
    [
        {
            text: '⬅',
            callback_data: 'Backward'
        }
    ],
    [
        {
            text: names.BackToMenu,
            callback_data: 'BackToMenu'
        }
    ]
]
const CatalogKeyboard = [
    [
        {
            text: '⬅',
            callback_data: 'Backward'
        },
        {
            text: '➡',
            callback_data: 'Forward'
        }
    ],
    [
        {
            text: names.BackToMenu,
            callback_data: 'BackToMenu'
        }
    ]
]
const RemoveGoodKeyboard = [
    [
        {
            text: names.RemoveGoodYes,
            callback_data: 'RemoveGoodByArticleAccept'
        },
        {
            text: names.RemoveGoodNo,
            callback_data: 'RemoveGoodByArticleRefuse'
        }
    ]
]
const MainKeyboard = [
    [
        {
            text: names.AddGood
        },
        {
            text: names.CatalogGood
        }
    ],
    [
        {
            text: names.FindGood
        },
        {
            text: names.RemoveGood
        }
    ],
    [
        {
            text: names.EditGood
        }
    ]
]
const WithoutPhotoKeyboard = [
    [
        {
            text: names.GoodWithoutPhoto,
            callback_data: 'Photo_Availability_false'
        }
    ]
]
const EditKeyboard = [
    [
        {
            text: names.EditArticle,
            callback_data: 'EditGoodArticle'
        },
        {
            text: names.EditName,
            callback_data: 'EditGoodName'
        }
    ],
    [
        {
            text: names.EditPrice,
            callback_data: 'EditGoodPrice'
        },
        {
            text: names.EditDescription,
            callback_data: 'EditGoodDescription'
        }
    ],
    [
        {
            text: names.EditPhoto,
            callback_data: 'EditGoodPhoto'
        },
        {
            text: names.EditAvailable,
            callback_data: 'EditGoodAvailable'
        }
    ]
]

const RefuseForm = {
    parse_mode: 'HTML',
    reply_markup: {
        resize_keyboard: true,
        keyboard: [
            [
                {
                    text: names.Refuse
                }
            ]
        ],
        one_time_keyboard: true
    }
}
const MainMenu = {
    parse_mode: 'HTML',
    reply_markup: {
        one_time_keyboard: true,
        resize_keyboard: true,
        keyboard: MainKeyboard
    }
}

module.exports = {
    logStart(){
        console.log('Bot has been started...')
    },
    debug,
    download,
    RefuseForm,
    MainMenu,
    MainKeyboard,
    ForwardKeyboard,
    BackwardKeyboard,
    CatalogKeyboard,
    RemoveGoodKeyboard,
    WithoutPhotoKeyboard,
    EditKeyboard
}
