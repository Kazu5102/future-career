
// App.tsx - v3.16 - Random Dog Encounters
import React, { useState, useEffect } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import { checkPassword } from './services/authService';
import { checkServerStatus } from './services/index';
import UserSelectionView from './views/UserSelectionView';

type AppMode = 'user' | 'admin';
type ServerStatus = 'checking' | 'ok' | 'error' | 'apiKeyMissing';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        checkServerStatus()
            .then(() => setServerStatus('ok'))
            .catch(() => setServerStatus('error'));
    }, []);

    const handleUserSelect = (userId: string) => setCurrentUserId(userId);
    const handleSwitchUser = () => setCurrentUserId(null);
    const handleSwitchMode = () => mode === 'user' ? setIsPasswordModalOpen(true) : setMode('user');

    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) {
            setMode('admin');
            setIsPasswordModalOpen(false);
            return true;
        }
        return false;
    };

    return (
        <div className="flex flex-col min-h-screen font-sans bg-slate-100">
            <header className="relative bg-slate-800 text-white p-2 text-center shadow-md z-10 sticky top-0">
                <div className="flex justify-center items-center">
                    <span className="mr-4 font-bold">表示モード: {mode === 'user' ? 'ユーザー画面' : '管理者画面'}</span>
                    <button onClick={handleSwitchMode} className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-sm">{mode === 'user' ? '管理者へ' : 'ユーザーへ'}</button>
                </div>
            </header>
            
            {serverStatus === 'error' && <div className="bg-amber-600 text-white text-center p-2 text-sm">サーバー接続確認中...または接続エラー</div>}

            <div className="flex-1 flex flex-col items-center justify-center">
              {mode === 'user' ? (!currentUserId ? <UserSelectionView onUserSelect={handleUserSelect} /> : <UserView userId={currentUserId} onSwitchUser={handleSwitchUser} />) : <AdminView />}
            </div>

            <PasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />
            <div className="fixed bottom-2 right-2 text-xs text-slate-400 z-10 bg-slate-100/50 backdrop-blur-sm px-2 py-1 rounded">
                Career Consulting Support_v3.16 (Random Dog Encounters)
            </div>
        </div>
    );
}

export default App;
