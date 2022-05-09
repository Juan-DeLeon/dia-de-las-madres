import knex, { Knex } from 'knex';
import { DEV_LIMIT } from './constants';

declare global { var pool: Knex; }

function init(): Knex {
    const dbConfig = {
        client: 'mssql',
        connection: {
            user: process.env.FREUD_USERNAME,
            password: process.env.FREUD_PASSWORD,
            host: process.env.FREUD_HOSTNAME || '',
            database: process.env.FREUD_DB_NAME,
            port: parseInt(process.env.FREUD_PORT || '1433'),
        },
        pool: { min: 0, max: 7 }
    }
    if (!global.pool) {
        console.log("starting new connection")
        global.pool = knex(dbConfig);
    }
    return global.pool;
}

// count: 8904
export async function getTelephoneNumbers(): Promise<string[]> {
    const pool = init();
    const query = pool.table('NFS_DBO.Representative_Table')
        .select(['Mobile_Tel_Num'])
        .where({
            Gender_Code: 'FE',
            Representative_Status_Code: 'AC'
        })
        .whereNotNull('Agency_Id');

    if (!global.production) {
        query.limit(DEV_LIMIT);
    }

    const data = await query;

    return data.map(el => "52" + el.Mobile_Tel_Num);
}

export function getTestNumbers() {
    return [].concat(...new Array(3).fill([
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
        "523222880384",
        "528112370258",
        "525511509953",
    ]));
}

export function closeDB() {
    const pool = init();
    pool.destroy();
}
