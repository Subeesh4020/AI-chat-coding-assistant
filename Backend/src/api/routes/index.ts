import { Router } from 'express';
import { gptChatRoute } from './gpt-chat-router';
import { GptChatQueueService } from '../../queues/gpt-chat-queue-services';


export function appRouter(gptChatQueueService: GptChatQueueService) {
    const router: Router = Router();

    router.use('/api/v1/users', gptChatRoute(gptChatQueueService));

    return router;
}