'use client';

import React from 'react';
import { Language } from '@/lib/translations';

interface LanguageSelectorProps {
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { code: Language; flag: string; title: string }[] = [
    { code: 'en', flag: '🇬🇧', title: 'English' },
    { code: 'sk', flag: '🇸🇰', title: 'Slovenčina' },
    { code: 'uk', flag: '🇺🇦', title: 'Українська' },
    { code: 'ru', flag: '🇷🇺', title: 'Русский' },
];

/**
 * LanguageSelector Component
 * Extracted from MainMenu for better code organization
 * Displays flag buttons to select game language
 */
export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
    return (
        <div className="flex gap-sm mt-4">
            {LANGUAGES.map(({ code, flag, title }) => (
                <button
                    key={code}
                    className={`btn btn-icon ${currentLanguage === code ? 'btn-primary' : 'btn-secondary'}`}
                    title={title}
                    onClick={() => onLanguageChange(code)}
                >
                    {flag}
                </button>
            ))}
        </div>
    );
}
