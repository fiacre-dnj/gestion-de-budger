import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    primary: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
  };

  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${variantClasses[variant]}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
