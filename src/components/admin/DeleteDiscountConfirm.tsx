import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getDiscountTypeLabel } from '@/lib/discount';
import type { UserDiscount } from '@/types/discount';

interface DeleteDiscountConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: UserDiscount;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteDiscountConfirm = ({
  open,
  onOpenChange,
  discount,
  onConfirm,
  isDeleting,
}: DeleteDiscountConfirmProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить скидку?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Вы уверены, что хотите удалить скидку <strong>{discount.discount_amount}%</strong> типа{' '}
              <strong>"{getDiscountTypeLabel(discount.discount_type)}"</strong>?
            </p>
            <p className="text-xs text-muted-foreground">
              ID пользователя: <code className="bg-secondary px-1 rounded">{discount.user_id}</code>
            </p>
            <p className="text-destructive">Это действие нельзя отменить.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
