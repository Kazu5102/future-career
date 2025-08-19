
import React, { useState, useEffect } from 'react';
import { verifyPassword } from '../utils/auth';
import KeyIcon from './icons/KeyIcon';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    setError('');

    // Simulate a short delay for better UX
    setTimeout(() => {
        if (verifyPassword(password)) {
            onSuccess();
        } else {
            setError('パスワードが正しくありません。');
        }
        setIsAuthenticating(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 text-center">管理者認証</h2>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 text-center">管理者画面にアクセスするにはパスワードを入力してください。</p>
            <div>
              <label htmlFor="admin-password" className="sr-only">パスワード</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <KeyIcon />
                </div>
                <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-100 rounded-lg border ${error ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-sky-500`}
                    placeholder="パスワード"
                    autoFocus
                />
              </div>
               {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
          <footer className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 font-semibold rounded-lg transition-colors duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isAuthenticating || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? '認証中...' : '認証'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
