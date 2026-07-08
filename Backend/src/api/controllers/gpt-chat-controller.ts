import { Request, Response, NextFunction } from 'express';
import { GptChatQueueService } from '../../queues/gpt-chat-queue-services';
import logger from '../../logger';

export const useGptChatController = (gptChatQueueService: GptChatQueueService) => ({
    
    
    gptChatController: async (req: Request, res: Response, next: NextFunction) => { 
        try {
            const { aiInput, msgSession } = req.body;
            logger.debug(`Prompt received - ${aiInput}`); 
       
            const anonId = req.headers['x-anonuser-id'] as string;
        
            if (!anonId) {   // 👈 runtime + TS check. Before using req.user.id check !req.user. See authmiddleware to see this
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized',
                });
                return;
            }

         
            if (!aiInput) {
                res.status(400).json({
                    success: false,
                    message: 'Missing prompt',
                });
                return;
            }

            // Send early response 
            res.status(200).json({
                success: true,
                status: 'processing',
                message: 'Prompt submitted to AI model',
            });

            // Send to queue
            await gptChatQueueService.queueGptChatPrompt(aiInput, msgSession, anonId);
        
            return;
        } catch (err: any) {
            let msg = 'Prompt submission error';
            res.status(500).json({
                success: false,
                message: msg,
                error: err.message,
            });
            return;
        }
    },
});
