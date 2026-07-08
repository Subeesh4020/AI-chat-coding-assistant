import pino, { LoggerOptions, Logger } from 'pino';
import path from 'path';
import dotenv from 'dotenv';

const envFile: string = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const isProduction = process.env.NODE_ENV === 'production';

const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
};

// 1. FOR PRODUCTION (JSON Output Layout)
// Appends a clean "caller" property tracking the file and line number
options.hooks = {
    logMethod(inputArgs: any[], method, level) {
        // Generate a quick call stack trace
        const stack = new Error().stack;
        
        // Split and target line 3 (which points back to where logger.info was called)
        const callerLine = stack?.split('\n')[3];
        
        // Use RegExp to isolate the file path, row, and column position
        const match = callerLine?.match(/\((.*):(\d+):(\d+)\)/) || callerLine?.match(/at\s+(.*):(\d+):(\d+)/);
        
        let callerContext = 'unknown';
        if (match) {
        const filePath = match[1];
        const line = match[2];
        const fileName = path.basename(filePath);
        callerContext = `${fileName}:${line}`;
        }

        // Inject the context directly into the log arguments array
        return method.apply(this, [ { caller: callerContext }, ...inputArgs ]);
    }
};

// Pretty logs only in dev
if (!isProduction) {
    options.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            messageFormat: '\x1b[36m[{caller}]\x1b[0m {msg}',
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,caller'
        }
    }
}

const logger: Logger = pino(options);

export default logger;

/* Usage
Log level	Dev	    Prod
debug	    ✅	    ❌
info	    ✅	    ✅
warn	    ✅	    ✅
error	    ✅	    ✅ */

// e.g., output - in prod. - {"level":20,"time":...,"pid":12345,"hostname":"server-1","ip":"192.168.1.10","msg":"WiFi IP detected"}
// e.g., output in dev. - 
// 15:42:11 DEBUG  WiFi IP detected
// ip: 192.168.1.10
