#!/usr/bin/env nodejs

// replace the value below with the Telegram token you receive from @BotFather
const TOKEN = process.env.TELEGRAM_TOKEN || '?';
const port = process.env.PORT || 8070;
const Url = process.env.URL || '?';
const webhook = `${Url}/bot${TOKEN}`;

// imports
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const url = require('url');

const app = express();
const bot = new TelegramBot(TOKEN /*,options */);

bot.setWebHook(webhook).catch((err) => {
    console.trace("Error: 40 ", err.stack)
});

// express plugins
app.use(bodyParser.json());

// express routes
app.post(url.parse(webhook).pathname, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('<h1>hello</h1>');
});

app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
});

bot.onText(/^\/start(.*)/, (msg, match) => {
    bot.sendMessage(msg.from.id, "hi :)");
});

bot.on('inline_query', (msg) => {
    if (msg.query.length > 0)
        bot.answerInlineQuery(msg.id, [{
            type: "article",
            id: uuid(),
            title: 'Marquee',
            message_text: msg.query,
            description: 'x',
            disable_web_page_preview: true,
            reply_markup: {inline_keyboard: [[{text: 'stop', callback_data: 'boz'}]]}
        }]);
});

bot.on('chosen_inline_result', (msg) => {
    messages.push(new message(msg.inline_message_id, msg.query, 'marquee', 120))
});

let messages = [];

class message {
    constructor(message_id, text, type, duration) {
        this.id = message_id;
        this.text = text;
        this.type = type;
        this.dur = this.ttl = duration;

        this.sent = text;
    }

    getText() {
        return {
            marquee: (text, step) => {
                let start = step % text.length;
                let txt = text.substring(start, Math.min(start + 50, text.length));
                if (txt.length < 50 && text.length > 50)
                    txt += "   ---   " + text;
                else if (text.length < 50 && start > 0)
                    txt += "   ---   " + text.substring(0, start)
                return txt.substring(0, 50);
            },
        }[this.type](this.text, this.dur - this.ttl);
    }

    update() {
        if (this.ttl-- > 0) {
            let newtext = this.getText();
            if (newtext.trim() !== this.sent.trim())
                bot.editMessageText(newtext, {inline_message_id: this.id})
                    .catch(err => {
                        this.ttl = 0;
                        console.trace(err)
                    });
            this.sent = newtext;
            return true;
        } else {
            return false;
        }
    }
}

const int = setInterval(() => {
    messages = messages.filter(x => x.update());
}, 1000);

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
