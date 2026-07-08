import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const SocketListener: React.FC = () => {

    const {   
        socketRef,
        isSocketLoading,
    } = useApp();

    useEffect(() => {
 
        if (isSocketLoading) {
            return;
        }

        // thrashPostsRef.current = thrashPosts; 
        if (!socketRef.current) return;

        socketRef.current.on('gptChatRes', async (data) => {
                
            if (!data) {
                console.error('❌ Data is null or undefined');
                return;
            }

            console.log('data.msgSession - ', data.msgSession);
            if (data.result && data.msgSession) {
                console.log('data.result - ', data.result);
                const customEvent = new CustomEvent('gptChatRes', {
                    detail: { 
                        result: data.result,
                        msgSession: data.msgSession
                    } 
                });
                window.dispatchEvent(customEvent);
            }
            
        });

        // Cleanup on unmount
        return () => {
            if (!socketRef.current) {
                return;
            }
            socketRef.current.off('aiRes');
        }
    }, [isSocketLoading]);
    
    // Return null - invisible component
    return null;
}

export default SocketListener;