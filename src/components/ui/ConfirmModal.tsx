'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    isLoading = false,
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-destructive" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="btn-secondary flex-1"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-danger flex-1 justify-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                                Deleting...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}