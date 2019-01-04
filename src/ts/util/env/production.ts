import {when} from "../misc/when";

const process = (global || window).process;
const nodeEnv = process && process.env && process.env.NODE_ENV;

export const production: boolean = !nodeEnv ? false : nodeEnv.toLowerCase() === "production";
export const development = !production;

export const inProduction = when(production);

export const inDevelopment = when(development);