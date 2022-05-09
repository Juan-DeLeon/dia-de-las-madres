import { Axios } from 'axios';
import fs from 'fs/promises';
import fs_sync from 'fs';
import { decode, JwtPayload } from 'jsonwebtoken';
import { AIVO_TEMPLATE, AXIOS_TIMEOUT, TOKEN_CACHE } from './constants';

const axios = new Axios({
    baseURL: process.env.AIVO_BASEURL,
    transformResponse: (r) => {
        try { return JSON.parse(r); }
        catch (_e) { return r; }
    },
    transformRequest: (r) => JSON.stringify(r),
    timeout: AXIOS_TIMEOUT
});

let tokenBearer = "";

function setupInterceptor() {
    axios.interceptors.request.use(async config => {
        config.headers = {
            'X-Token': process.env.AIVO_XTOKEN!,
            'Authorization': tokenBearer,
            'Content-Type': 'application/json'
        }
        return config;
    });
}

export async function auth() {
    try {
        if (fs_sync.existsSync(TOKEN_CACHE)) {
            const token = await fs.readFile(TOKEN_CACHE, { encoding: 'utf-8' });
            const dec = decode(token.replace("Bearer ", "")) as JwtPayload;
            const now = new Date();
            if (now.getTime() < dec.exp! * 1000) {
                console.log("token is still valid")
                tokenBearer = token;
                setupInterceptor();
                return;
            }
        }

        const res = await axios.post('/auth', {
            "user": process.env.AIVO_USER,
            "password": process.env.AIVO_PASSWORD
        }, {
            headers: {
                'X-Token': process.env.AIVO_XTOKEN!,
                'Content-Type': 'application/json'
            }
        });

        console.log(res.data);
        tokenBearer = res.data.Authorization;
        await fs.writeFile(TOKEN_CACHE, tokenBearer);

        setupInterceptor();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function sendMessage(tel: string) {
    try {
        if (process.env.NODE_ENV != "production")
            console.warn("NO ESTAS EN PROD Y SE ESTAN ENVIANDO MENSAJES");

        const res = await axios.post('/conversation-whatsapp-native-templates', {
            to: tel,
            type: "template",
            template: {
                namespace: process.env.AIVO_NAMESPACE,
                name: AIVO_TEMPLATE,
                language: {
                    policy: "deterministic",
                    code: "es_MX"
                },
                components: []
            }
        });

        return res;
    } catch (err: any) {
        if (err.response) {
            return err.response;
        }
        else {
            throw err;
        }
    }
}

export async function fakeSendMessage(_tel: string) {
    console.log("fakeSendMessage");
    if (process.env.NODE_ENV == "production")
            console.warn("Estas en prod y no se estan enviando mensajes")
    // fake post lead to test http status code errors
    try {
        let httpStatusCode = 200;
        if (Math.random() < 0.5)
            httpStatusCode = 500;

        const res = await axios.get('https://httpstat.us/' + httpStatusCode);

        return res;
    } catch (err: any) {
        console.error(err);
        if (err.response) {
            return err.response;
        }
        else {
            throw err;
        }
    }
}