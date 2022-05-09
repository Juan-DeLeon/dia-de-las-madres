import fs from 'node:fs';
import { LOG_ENVIADOS, LOG_STATS } from './constants';

export interface ILog {
    tel: string,
    statusCode: number
}

export interface IStats {
    horaInicio: Date,
    horaFin?: Date,
    tiempoMilis?: number,
    totalEnviados?: number,
    exitosos: number,
    errores: number
}

export class Logger {
    static stream = fs.createWriteStream(LOG_ENVIADOS, { flags: "w" });

    static stats: IStats = {
        horaInicio: new Date(),
        exitosos: 0,
        errores: 0
    };

    static start() {
        this.stream.write('telefono,statusCode\n');
    }

    static write(logs: ILog[]) {
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

    private static writeStats() {
        this.stats.horaFin = new Date();
        this.stats.tiempoMilis = this.stats.horaFin.getTime() - this.stats.horaInicio.getTime();

        const file = fs.openSync(LOG_STATS, "w");
        let data = JSON.stringify(this.stats, null, 4);
        fs.writeSync(file, data);
        fs.closeSync(file);
    }
}
