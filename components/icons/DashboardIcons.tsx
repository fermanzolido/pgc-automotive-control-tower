
import React from 'react';

const iconStyle = "w-6 h-6 text-cyan-400";

export const DollarSignIcon: React.FC = () => (
    <svg className={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v22m-4-18h8.5a4.5 4.5 0 0 1 0 9h-7a4.5 4.5 0 0 0 0 9H12"></path>
    </svg>
);

export const CarIcon: React.FC = () => (
    <svg className={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM5 12V7a2 2 0 012-2h10a2 2 0 012 2v5h2a1 1 0 011 1v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1h1z"></path>
    </svg>
);

export const TrendingUpIcon: React.FC = () => (
    <svg className={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
    </svg>
);

export const UsersIcon: React.FC = () => (
    <svg className={iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 00-4-4H4a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm8 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path>
    </svg>
);

export const MapPinIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
    </svg>
);

export const XIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const WarehouseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-13l9-5 9 5v13H3z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h4v8h-4v-8zM7 13h4v8H7v-8z"></path>
    </svg>
);

export const UserCircleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0 1 12 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
    </svg>
);

export const TruckIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0h6m-6 0V6a2 2 0 012-2h8a2 2 0 012 2v8m-10 0h4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a2 2 0 11-4 0 2 2 0 014 0zm14 0a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export const CheckCircleIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Add missing icons used in the AI Assistant component.
export const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export const PaperAirplaneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

export const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const MailIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

export const PhoneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
    </svg>
);

export const LocationMarkerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L12 21.25l-5.657-4.593A8 8 0 1117.657 16.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

export const DocumentDownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
);

export const ZapIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export const PercentIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19l14-14M5 5l14 14M19 5a2 2 0 11-4 0 2 2 0 014 0zM5 19a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

export const ArrowRightIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className || iconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

