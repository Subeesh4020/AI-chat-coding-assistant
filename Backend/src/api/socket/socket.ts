import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPSServer } from 'https';
import http, { Server as HttpServer } from "http";

import dotenv from 'dotenv';
import logger from '../../logger';
import { createAdapter } from "@socket.io/redis-adapter";
import { getPubSubRedisInfra } from '../../redis';
import { createClient } from "redis";

const envFile: string = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: envFile });

const jwt_access_secret = process.env.JWT_ACCESS_SECRET || '';
let io: SocketIOServer;

const allowedOrigins = [
    process.env.FRONTEND_URL,
];

export const initializeSocket = async (server: HTTPSServer | HttpServer): Promise<SocketIOServer> => {

    io = new SocketIOServer(server, {
        cors: {
            origin: allowedOrigins[0],
            methods: ['GET', 'POST'],
            credentials: true || false,
        }
    });

    // const pubRedisInfra = getPubSubRedisInfra('pub-redis-infra');
    // const subRedisInfra = getPubSubRedisInfra('sub-redis-infra');
    // // For kafka service emit event using a redis client to listen
    // io.adapter(createAdapter(pubRedisInfra.redis, subRedisInfra.redis));
    const subscriber = createClient();

    await subscriber.connect(); 

    subscriber.subscribe("ai_response", (message: any) => { // This event is generating from python ai service
        const data = JSON.parse(message);
        // data.event = "gptChatRes"
        io.to(`user:${data.userId}`).emit(data.event, {
                result: data.payload.result,    
                msgSession: data.msg_session
            }
        );
    });

    io.on('connection', (socket: Socket) => { // in-built listener
        logger.debug(`✅ A user connected: ${socket.id}`);

        socket.on('disconnect', async() => {  // in-built listener
            logger.debug(`✅ A user disconnected: ${socket.id}`);
        });

        socket.on('admin-login', async(adminEmail: string) => {  // Custom listener
            logger.info(`✅ Admin logined : ${adminEmail}`); //
        });

        socket.on('admin-logout', async(adminEmail: string) => {  // Custom listener
            // removeAdmin(socket.id);
            logger.info(`✅ Admin logged out : ${adminEmail}`); //
        });

        socket.on('join-user-room', (userId: string) => {
            socket.join(`user:${userId}`);
            logger.debug(`✅ A user joined the socket user-room: ${userId}`);
        });

        socket.on('leave-user-room', (userId: string) => {
            socket.leave(`user:${userId}`);
            logger.debug(`✅ A user left the socket user-room: ${userId}`);
        });

        //Test function
        socket.on('hello', (callback) => {
            logger.debug('Received hello');
            callback('world');
        });
    });

    return io;
};

export const broadcastGptChatRes = async (
    gptChatRes: any
): Promise<void> => {
    
    if (!io) {
        logger.error('Socket.io is not initialized');
        return;
    }
    logger.debug('gptChatRes');
    console.log("Emitting:", `user:${gptChatRes.userId}`);
    io.to(`user:${gptChatRes.userId}`).emit('gptChatRes', { gptChatRes: gptChatRes });
};