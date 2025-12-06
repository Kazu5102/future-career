
import React, { useState } from 'react';
import { setPassword } from '../services/authService';
import KeyIcon from './icons/KeyIcon';
import TrashIcon from './icons/TrashIcon';

interface AdminSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearAllData: () => void;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose, onClearAllData }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = setPassword(newPassword, currentPassword);
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <KeyIcon className="h-5 w-5 text-slate-600" /> 
                        管理者設定
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                
                <div className="p-6 space-y-8">
                    {/* Password Section */}
                    <section>
                        <h4 className="text-sm font-semibold text-slate-700 mb-4 border-b pb-2">パスワード変更</h4>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">現在のパスワード</label>
                                <input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={e => setCurrentPassword(e.target.value)} 
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">新しいパスワード (4文字以上)</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)} 
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                                    required 
                                />
                            </div>
                            <button type="submit" className="w-full bg-slate-700 text-white px-3 py-2.5 rounded-md hover:bg-slate-800 font-semibold transition-colors text-sm">
                                変更を保存
                            </button>
                            {message && (
                                <div className={`text-xs p-3 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                        </form>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-6 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
                            <TrashIcon className="h-4 w-4"/> デンジャーゾーン
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            すべてのユーザーデータと相談履歴を削除します。<br/>この操作は取り消すことができません。
                        </p>
                        <button 
                            onClick={() => {
                                if(window.confirm("本当にすべてのデータを削除しますか？")) {
                                    onClearAllData();
                                    onClose();
                                }
                            }}
                            className="w-full border border-red-200 bg-red-50 text-red-600 px-3 py-2.5 rounded-md hover:bg-red-100 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <TrashIcon className="h-4 w-4"/>
                            全データを削除する
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsModal;
