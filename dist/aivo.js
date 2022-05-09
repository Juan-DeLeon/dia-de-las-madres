"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeSendMessage = exports.sendMessage = exports.auth = void 0;
const axios_1 = require("axios");
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = require("jsonwebtoken");
const constants_1 = require("./constants");
const axios = new axios_1.Axios({
    baseURL: process.env.AIVO_BASEURL,
    transformResponse: (r) => {
        try {
            return JSON.parse(r);
        }
        catch (_e) {
            return r;
        }
    },
    transformRequest: (r) => JSON.stringify(r),
    timeout: constants_1.AXIOS_TIMEOUT
});
let tokenBearer = "";
function setupInterceptor() {
    axios.interceptors.request.use(async (config) => {
        config.headers = {
            'X-Token': process.env.AIVO_XTOKEN,
            'Authorization': tokenBearer,
            'Content-Type': 'application/json'
        };
        return config;
    });
}
async function auth() {
    try {
        if (fs_1.default.existsSync(constants_1.TOKEN_CACHE)) {
            const token = await promises_1.default.readFile(constants_1.TOKEN_CACHE, { encoding: 'utf-8' });
            const dec = (0, jsonwebtoken_1.decode)(token.replace("Bearer ", ""));
            const now = new Date();
            if (now.getTime() < dec.exp * 1000) {
                console.log("token is still valid");
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
                'X-Token': process.env.AIVO_XTOKEN,
                'Content-Type': 'application/json'
            }
        });
        console.log(res.data);
        tokenBearer = res.data.Authorization;
        await promises_1.default.writeFile(constants_1.TOKEN_CACHE, tokenBearer);
        setupInterceptor();
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}
exports.auth = auth;
async function sendMessage(tel) {
    try {
        if (process.env.NODE_ENV != "production")
            console.warn("NO ESTAS EN PROD Y SE ESTAN ENVIANDO MENSAJES");
        const res = await axios.post('/conversation-whatsapp-native-templates', {
            to: tel,
            type: "template",
            template: {
                namespace: process.env.AIVO_NAMESPACE,
                name: constants_1.AIVO_TEMPLATE,
                language: {
                    policy: "deterministic",
                    code: "es_MX"
                },
                components: []
            }
        });
        return res;
    }
    catch (err) {
        if (err.response) {
            return err.response;
        }
        else {
            throw err;
        }
    }
}
exports.sendMessage = sendMessage;
async function fakeSendMessage(_tel) {
    console.log("fakeSendMessage");
    if (process.env.NODE_ENV == "production")
        console.warn("Estas en prod y no se estan enviando mensajes");
    // fake post lead to test http status code errors
    try {
        let httpStatusCode = 200;
        if (Math.random() < 0.5)
            httpStatusCode = 500;
        const res = await axios.get('https://httpstat.us/' + httpStatusCode);
        return res;
    }
    catch (err) {
        console.error(err);
        if (err.response) {
            return err.response;
        }
        else {
            throw err;
        }
    }
}
exports.fakeSendMessage = fakeSendMessage;
