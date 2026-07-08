
import { broadcastGptChatRes } from '../api/socket/socket';

export async function processGptChat(prompt: string, userId: string, msgSession: string) {
    /// 
    let result = prompt;
    console.log('result - ', result);
    console.log('userId - ', userId);
    await broadcastGptChatRes({ result: result, userId: userId, msgSession: msgSession });
    return result;
}