"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
global.production = process.env.NODE_ENV == "production";
const limiter_1 = require("limiter");
const aivo_1 = require("./aivo");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
const send = global.production ? aivo_1.sendMessage : aivo_1.fakeSendMessage;
class Program {
    static limiter = new limiter_1.RateLimiter({ tokensPerInterval: constants_1.CONCURRENCY_LIMIT, interval: "second" });
    static promises = [];
    static logs = [];
    static async main() {
        try {
            logger_1.Logger.start();
            await (0, aivo_1.auth)();
            // const list = await getTelephoneNumbers();
            const list = [].concat(...new Array(10).fill([
                "528712770978",
                "522221524595",
                "528116833868",
                "522223570633",
                "522226857559",
                "522225549990",
                "522221920338",
                "522221583338",
                "522221177022",
                "522227445979",
                "522225665395"
            ]));
            logger_1.Logger.stats.totalEnviados = list.length;
            for (const tel of list) {
                await this.limiter.removeTokens(1);
                this.promises.push(send(tel));
                this.logs.push({ tel: tel, statusCode: 202 }); // logger
                if (this.promises.length >= constants_1.CONCURRENCY_LIMIT) {
                    console.log("Enviando 20 mensajes");
                    // resolve promises array
                    await this.sendBatch();
                }
            }
            await this.sendBatch();
            logger_1.Logger.end();
            // closeDB();
        }
        catch (err) {
            console.error("se produjo un error en el envio", err);
        }
    }
    static async sendBatch() {
        const responses = await Promise.all(this.promises);
        // register for logs
        responses.forEach((el, i) => {
            el.status == 200 ? logger_1.Logger.stats.exitosos++ : logger_1.Logger.stats.errores++;
            // update status code
            this.logs[i].statusCode = el.status || 500;
        });
        logger_1.Logger.write(this.logs); // write log
        // empty arrays
        this.logs = [];
        this.promises = [];
    }
}
Program.main().then(() => {
    console.log("finalizado");
});
