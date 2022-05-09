"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const constants_1 = require("./constants");
class Logger {
    static stream = node_fs_1.default.createWriteStream(constants_1.LOG_ENVIADOS, { flags: "w" });
    static stats = {
        horaInicio: new Date(),
        exitosos: 0,
        errores: 0
    };
    static start() {
        this.stream.write('telefono,statusCode\n');
    }
    static write(logs) {
        let data = "";
        for (const log of logs) {
            data += `${log.tel},${log.statusCode}\n`;
        }
        this.stream.write(data);
    }
    static end() {
        this.writeStats();
        this.stream.end();
        this.stream.close();
    }
    static writeStats() {
        this.stats.horaFin = new Date();
        this.stats.tiempoMilis = this.stats.horaFin.getTime() - this.stats.horaInicio.getTime();
        const file = node_fs_1.default.openSync(constants_1.LOG_STATS, "w");
        let data = JSON.stringify(this.stats, null, 4);
        node_fs_1.default.writeSync(file, data);
        node_fs_1.default.closeSync(file);
    }
}
exports.Logger = Logger;
