/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAnonymousId } from '../utils/get-anonymous-id';
import { yieldToBrowser } from '../utils/yield-to-browser';


interface AppContextType {
    getSocket: (anon_id: string) => Socket;
    isSocketConnected: boolean;
    socketRef: React.RefObject<Socket | null>;
    isSocketLoading: boolean; 
    disconnectSocket: () => void;    
    anonId: string;
}

const backendUrls = [
  import.meta.env.VITE_API_BACKEND,
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const socketRef = useRef<Socket | null>(null);
    
    // const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isSocketLoading, setIsSocketLoading] = useState(true); 
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [anonId, setAnonId] = useState<string>('');

    const baseUrl = backendUrls[0];

    // Socket context
    const handleConnect = (label: string, userId: string) => {
        try {
            console.debug(`✅ Socket connected(${label}): ${socketRef.current?.id}`); // console.log will not work here

            setIsSocketConnected(true);
            setIsSocketLoading(false); // Connection complete, stop loading
           
            if (socketRef.current?.id && userId && userId !== '') {
                socketRef.current.emit('join-user-room', userId);
            }
        
        } catch (err: any) {
            console.debug(`Socket handleConnect error! - ${err}`);
        } 
    }
    
    const getSocket = (anon_id: string): Socket => {
  
        // If socket already exists and is connected, return it
        if (socketRef.current && socketRef.current.connected) {
            console.debug('Socket already connected, returning the instance');
            return socketRef.current;
        }

        setIsSocketLoading(true);
        console.log('Starting socket connection setup...')
        // Reconnect with new auth credentials
        socketRef.current = io(baseUrl, {
            transports: ['websocket'],
            autoConnect: false,
            withCredentials: true,
            rejectUnauthorized: false, 
            auth: {
                user_id: anon_id,
            }
        });
        
        socketRef.current?.on('connect', () => {
            const userId = anon_id;
            handleConnect('apiSocket', userId);
        });

        socketRef.current.on('disconnect', () => {
            console.debug('❌ Socket disconnected');
            setIsSocketConnected(false);
        });
        
        console.log('✅ Socket connecting .....');
        socketRef.current.connect(); // 🔑 connect AFTER listener

        return socketRef.current;
    };

    // Disconnect socket
    const disconnectSocket = (): void => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsSocketConnected(false);
            console.debug('Socket disconnect');
        }
    };

    useEffect(() => {
    
        // if (isLoading) {
        //     return;
        // }

        (async () => {
            const { anonId, isNewUser } = getAnonymousId();
            console.log(`isNewUser - ${isNewUser}`); ///
            setAnonId(anonId);
            await yieldToBrowser();
            const socket: Socket = getSocket(anonId);
            console.log(`socket - ${socket}`); ///
        })();

        // Cleanup on unmount
        return () => {
            if (!socketRef.current) {
                return;
            }
            if (socketRef.current) {
                disconnectSocket();
            }
        }
    }, [/*isLoading*/]);
    
    return (
        <AppContext.Provider value={{
            getSocket,
            isSocketConnected,
            socketRef,
            isSocketLoading,
            disconnectSocket,
            anonId
        }}>
        {/* { isLoading ? "Loading...AuthContext" : children } */} { children }
        </AppContext.Provider>
    );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
};

// export { AppProvider, useApp };