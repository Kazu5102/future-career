
import React from 'react';
import { marked } from 'marked';
import { ChatMessage, MessageAuthor } from '../types';
import UserIcon from './icons/UserIcon';
import RobotIcon from './icons/RobotIcon';
import EditIcon from './icons/EditIcon';

interface MessageBubbleProps {
  message: ChatMessage;
  isEditable?: boolean;
  onEdit?: () => void;
  isThinking?: boolean;
}

const createMarkup = (markdownText: string) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isEditable, onEdit, isThinking }) => {
  const isUser = message.author === MessageAuthor.USER;

  const bubbleClasses = isUser
    ? 'bg-sky-600 text-white prose prose-invert'
    : 'bg-slate-200 text-slate-800 prose prose-slate';

  const containerClasses = isUser
    ? 'justify-end'
    : 'justify-start';

  return (
    <div className={`group flex items-end gap-2 ${containerClasses}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
          <RobotIcon isThinking={isThinking} />
        </div>
      )}
       {isEditable && isUser && (
        <button 
          onClick={onEdit}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
          aria-label="メッセージを編集"
        >
          <EditIcon />
        </button>
      )}
      <div className={`max-w-lg lg:max-w-2xl px-5 py-3 rounded-2xl ${bubbleClasses} ${isUser ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
        {message.text ? (
          <div dangerouslySetInnerHTML={createMarkup(message.text)} />
        ) : (
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '-0.3s'}}></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" style={{animationDelay: '-0.15s'}}></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;