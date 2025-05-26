import { useAuth } from '../hooks/useAuth';
import { SocketProvider } from '../contexts/SocketContext';

export default function SocketProviderWithAuth({ children }) {
    const { user, token } = useAuth();

    return (
        <SocketProvider user={user} token={token}>
            {children}
        </SocketProvider>
    );
}
