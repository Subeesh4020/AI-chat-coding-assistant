import { Router } from 'express';
import { useGptChatController } from '../controllers';
import { GptChatQueueService } from '../../queues/gpt-chat-queue-services';


export function gptChatRoute(gptChatQueueService: GptChatQueueService) {
    const router: Router = Router();

    const chatController = useGptChatController(gptChatQueueService);
    router.post('/aichat', chatController.gptChatController); 

    return router;
};