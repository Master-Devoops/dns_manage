'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClass: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
}: ModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
            onClick={(e) => {
                if (e.target === backdropRef.current) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`
          relative w-full ${sizeClass[size]}
          card-elevated modal-enter
          max-h-[90vh] flex flex-col
        `}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-border flex-shrink-0">
                    <div>
                        <h2
                            id="modal-title"
                            className="text-base font-semibold text-foreground"
                        >
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-ghost p-1.5 -mr-1 -mt-1 ml-4 flex-shrink-0"
                        aria-label="Close modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </div>
        </div>
    );
}