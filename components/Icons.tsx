import type React from 'react';

export interface IconProps {
  className?: string;
}

export const LoadingSpinner: React.FC<IconProps> = ({ className = 'w-full h-full' }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`
      @keyframes spinner-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      svg {
        animation: spinner-spin 1s linear infinite;
      }
    `}</style>
  </svg>
);

export const HumanAvatar1: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#E0E0E0"/>
      <path d="M50 80 C 65 80, 75 70, 75 55 S 65 30, 50 30 S 25 40, 25 55 S 35 80, 50 80 Z" fill="#424242"/>
      <circle cx="38" cy="48" r="4" fill="white"/>
      <circle cx="62" cy="48" r="4" fill="white"/>
      <path d="M40 65 Q 50 75, 60 65" stroke="white" strokeWidth="3" fill="none"/>
    </svg>
);
export const HumanAvatar2: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#f0e4d7"/>
        <path d="M30,90 C40,70 60,70 70,90 L75,100 L25,100 Z" fill="#A52A2A" />
        <circle cx="50" cy="45" r="25" fill="#ffcba4"/>
        <circle cx="42" cy="45" r="3" fill="black"/>
        <circle cx="58" cy="45" r="3" fill="black"/>
        <path d="M45,55 Q50,60 55,55" stroke="black" strokeWidth="2" fill="none" />
    </svg>
);
export const DogAvatar1: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#8D6E63"/>
        <circle cx="35" cy="45" r="5" fill="black"/>
        <circle cx="65" cy="45" r="5" fill="black"/>
        <path d="M50,60 Q50,70 55,70 A 15 15 0 0 1 45 70 Q50,70 50,60" fill="white" />
        <path d="M20,30 C0,50 10,20 25,20 S 30,40 20,30 Z" fill="#A1887F"/>
        <path d="M80,30 C100,50 90,20 75,20 S 70,40 80,30 Z" fill="#A1887F"/>
    </svg>
);
export const DogAvatar2: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#EFEBE9"/>
        <path d="M30 30 C 20 10, 40 15, 40 30 Z" fill="#BCAAA4"/>
        <circle cx="38" cy="48" r="5" fill="#424242"/>
        <circle cx="62" cy="48" r="5" fill="#424242"/>
        <path d="M50 55 A 10 10 0 0 1 50 65 A 10 10 0 0 1 50 55" fill="#424242"/>
    </svg>
);

export const MicrophoneIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

export const SendIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);
