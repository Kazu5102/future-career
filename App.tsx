
import React, { useState } from 'react';
import UserView from './views/UserView';
import AdminView from './views/AdminView';
import PasswordModal from './components/PasswordModal';
import { checkPassword } from './services/authService';

type AppMode = 'user' | 'admin';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('user');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const handleSwitchToAdmin = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = (password: string): boolean => {
        if (checkPassword(password)) {
            setMode('admin');
            setIsPasswordModalOpen(false);
            return true;
        }
        return false;
    };

    const handleSwitchMode = () => {
        if (mode === 'user') {
            handleSwitchToAdmin();
        } else {
            setMode('user');
        }
    };

    return (
        <div className="flex flex-col h-screen font-sans bg-slate-100">
            <div className="bg-slate-800 text-white p-2 text-center shadow-md z-10">
                <span className="mr-4 font-bold">表示モード: {mode === 'user' ? 'ユーザー画面 (AIキャリア相談)' : '管理者画面'}</span>
                <button
                    onClick={handleSwitchMode}
                    className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-sm transition-colors"
                >
                    {mode === 'user' ? '管理者画面へ' : 'ユーザー画面へ'}
                </button>
                <p className="text-xs text-slate-400 mt-1">（これはデモ用の表示切り替え機能です）</p>
            </div>
            <div className="flex-1 overflow-hidden">
              {mode === 'user' ? <UserView /> : <AdminView />}
            </div>
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
            />
        </div>
    );
}

export default App;
