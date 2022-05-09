import dotenv from 'dotenv';
dotenv.config();

declare global { var production: boolean; }
global.production = process.env.NODE_ENV == "production";

import { RateLimiter } from 'limiter';
import { auth, fakeSendMessage, sendMessage } from './aivo';
import { CONCURRENCY_LIMIT } from './constants';
import { closeDB, getTelephoneNumbers } from './db';
import { ILog, Logger } from './logger';

const send = global.production ? sendMessage : fakeSendMessage;

class Program {
    static limiter = new RateLimiter({ tokensPerInterval: CONCURRENCY_LIMIT, interval: "second" });

    static promises: Promise<any>[] = [];
    static logs: ILog[] = []

    static async main() {
        try {
            Logger.start();

            await auth();
            // const list = await getTelephoneNumbers();
            const list = [].concat(...new Array(5).fill([
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
                "522225665395",
                "522221240619",
                "522225992129",
                "527341088905",
                "525518774703",
                "527775319735",
                "527343497210",
                "527775605468",
                "525538989360",
                "525545001639",
                "525515906560",
                "525584117057",
            ]));

            Logger.stats.totalEnviados = list.length;

            for (const tel of list) {
                await this.limiter.removeTokens(1);

                this.promises.push(send(tel));
                this.logs.push({ tel: tel, statusCode: 202 }); // logger

                if (this.promises.length >= CONCURRENCY_LIMIT) {
                    console.log("Enviando 20 mensajes");
                    // resolve promises array
                    await this.sendBatch();
                }
            }

            await this.sendBatch();

            Logger.end();
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
            el.status == 200 ? Logger.stats.exitosos++ : Logger.stats.errores++;

            // update status code
            this.logs[i].statusCode = el.status || 500;
        });
        Logger.write(this.logs); // write log
        // empty arrays
        this.logs = [];
        this.promises = [];
    }
}

Program.main().then(() => {
    console.log("finalizado");
});