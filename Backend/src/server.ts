import express, { Request, Response, NextFunction, Express } from 'express'; //use express module to create a server obj
import IORedis from 'ioredis';
// import { Queue } from 'bullmq';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

//For flutter app .dev purpose
import http, { Server as HttpServer } from "http";

import https, { Server as HttpsServer } from 'https';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import logger from './logger';

import { appRouter } from './api/routes/index'; // import a centralized routes group
import { initializeSocket } from './api/socket/socket';
import { RedisClientInfra } from './redis';
import { QueueInfra } from './queues';
// import { GptChatWorker } from './workers';
import { GptChatQueueService } from './queues/gpt-chat-queue-services';
import { 
    initPubSubRedis,
    closePubSubRedis
} from './redis';

import * as fs from 'fs';

// Load env file based on NODE_ENV
const envFile: string = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: envFile });

const certPath = process.env.SSL_CERT || './ssl/certificate.crt';
const keyPath = process.env.SSL_KEY || './ssl/certificate.key';

const allowedOrigins = [
    process.env.FRONTEND_URL1 as string,
    process.env.FRONTEND_URL2 as string,
    'https://qstgrbsm-5173.inc1.devtunnels.ms'
];

const host: string | undefined = process.env.HOST; 
const port: number = Number(process.env.PORT || 7860);

const app: Express = express(); // create a server

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 1 * 1000, // 1 second
    max: 10000, // 10,000 requests per second globally
    handler: (req: Request, res: Response) => {
        res.status(429).json({ error: 'System overloaded' });
    }
});

// Express rate limiter configuration
const ipLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 Sec window
    max: 60, // Maximum 60 requests per 10 Secs per user
    keyGenerator: (req: Request) =>  ipKeyGenerator(req.ip ?? 'unknown-ip'),
    message: { message: 'Too many requests from this IP, please try again after some time' },
    headers: true,
});

const corsOptions = {
    origin: function (origin: string | undefined, callback: Function) {
        // Allow requests with no origin (like mobile apps or curl requests)
        console.log("CORS callback origin:", origin);
        console.log("Allowed:", allowedOrigins);

        if (!origin) {
            console.log("No origin");
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            console.log("Origin allowed");
            callback(null, origin);
        } else {
            console.log("Cors blocked");
            return callback(new Error("Not allowed by CORS"));
        }
      
    },
    credentials: true,
    exposedHeaders: ['Authorization'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-socket-id',
        'x-anonuser-id',
        // 'Cookie'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log("Method:", req.method);
        console.log("Origin:", req.headers.origin);
        next();
    });
}

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(globalLimiter);
app.use(ipLimiter);
app.use(cookieParser());

app.use(helmet());
app.use(express.json()); //middleware to parse JSON

let server: HttpsServer | HttpServer;
//if (process.env.NODE_ENV === 'production') {
    // HTTP for production
    server = http.createServer(app); //This binding is required to handle some low-level server event handling
//} else {
    // HTTPS for development
    //const cert: Buffer = fs.readFileSync(certPath);
    //const key: Buffer = fs.readFileSync(keyPath);
    //server = https.createServer({ key, cert }, app); //This binding is required to handle some low-level server event handling
//}

let aiQueueRedisInfra: RedisClientInfra;
let aiQueueInfra: QueueInfra;
// let gptChatWorker: GptChatWorker;
let gptChatQueueService: GptChatQueueService;

async function initQueueWorkers() {
    // Setup redis connection
    aiQueueRedisInfra = new RedisClientInfra('gpt-chat-redis');
    aiQueueRedisInfra.init();
    aiQueueRedisInfra.testRedisConnection();

    // Setup and start queue
    aiQueueInfra = new QueueInfra(aiQueueRedisInfra.redis, 'gpt-chat');
    aiQueueInfra.init();
    aiQueueInfra.testQueueRedisConnection();

    // Setup and start worker
    // gptChatWorker = new GptChatWorker(aiQueueRedisInfra.redis, 'gpt-chat');
    // gptChatWorker.init();

    gptChatQueueService = new GptChatQueueService(aiQueueRedisInfra.redis, aiQueueInfra.queue, 'gpt-chat');
};


async function bootStrap() {
    
    try {
        logger.info('🚀 Server starting...');

        // Redis socket notification
        await initPubSubRedis('api-pub-redis', 'api-sub-redis');

        await initializeSocket(server); //Initialize socket.io with the server

        // Start API Queue and workers
        await initQueueWorkers();

        if (gptChatQueueService) {
            app.use(appRouter(gptChatQueueService));
        } else {
            logger.error('Some services are still not ready, restart the server');
        }
        server.listen(port, () => {
            logger.info(`Server running on ${host}:${port}`);
        });
    } catch (err: any) {
        logger.error('Server startup failed', err);
        process.exit(1);
    }
};

bootStrap();

//Confirm that the server is listening after successfull start
server.on('listening', () => {
    logger.info('Server successfully started');
    logger.info(`Server is listening on localhost:${port}`);
});

//Handle error when server starts
server.on('error', (err: NodeJS.ErrnoException) => {
    logger.error({err}, `Server error: , ${err.message}`);
    if (err.code === 'EADDRINUSE') { //In case any error happened by the selected port number
        logger.warn(`Port ${port} is already in use`);
        //////////////////////////////////////
        //code to handle to manually select a port and manual restart of server using electron
        //////////////////////////////////////
    }
});

server.on('close', () => {
   logger.info('All API connections closed');
});


const closeServer = () => {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      logger.warn('Force closing server (timeout)');
      resolve();
    }, 10000);

    server.close(() => {
      clearTimeout(timeout);   // ⭐ stop timeout
      logger.info('HTTP server closed');
      resolve();
    });
  });
};


//Server and database shut down function 
const serverShutdown = async (): Promise<void> => {
    
    try {
        logger.info('Server shutting down started...');
        await closeServer();
        // Stop all Workers, Queueu events, Queueu and Redis for queue
        if (aiQueueInfra) {
            // await gptChatWorker.closeGptChatWorker(); // First close all workers related to the queue
            await gptChatQueueService.closeQueueEvents(); // Then close all queue events related to queue
            await aiQueueInfra.closeQueue(); // Then close all queue 
            await aiQueueInfra.closeQueueRedis(); // At last close the redis connection which makes the queue possible            
        }
       
    } catch (err: any) {
        logger.error({err}, '❌ Error stopping schedulers');
    }
};

const withTimeout = (promise: Promise<any>, timeoutMs: number, operation: string): Promise<any> => {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms for ${operation}`)), timeoutMs)
        )
    ]);
};

let isGracefullShuttingDown = false;

const gracefulShutdown = async (signal?: string): Promise<void> => {
    if (isGracefullShuttingDown) {
        logger.warn(`Shutdown already running. Ignoring ${signal}`);
        return;
    }

    isGracefullShuttingDown = true;
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        logger.info('🚨 Starting graceful shutdown process...');
        
        logger.info('🛑 Server shutdown called...');
        await withTimeout(serverShutdown(), 60000, 'serverShutdown');
        logger.info('✅ Server shutdown completed');

        logger.info('🎉 All cleanup completed successfully');
        process.exit(0);
        
    } catch (err: any) {
        logger.error({err}, '❌ Shutdown error');
        process.exit(1);
    }
};

process.removeAllListeners('SIGTERM');
process.removeAllListeners('SIGINT');

// Signal listeners
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);