import { useState, useEffect } from 'react';
import { useUpdateDiscount } from '@/hooks/useUserDiscounts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserDiscount } from '@/types/discount';

interface EditDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: UserDiscount;
}

export const EditDiscountDialog = ({
  open,
  onOpenChange,
  discount,
}: EditDiscountDialogProps) => {
  const updateDiscount = useUpdateDiscount();

  const [discountAmount, setDiscountAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPermanent, setIsPermanent] = useState(true);
  const [validUntil, setValidUntil] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Инициализация формы при открытии
  useEffect(() => {
    if (discount) {
      setDiscountAmount(discount.discount_amount.toString());
      setDescription(discount.description || '');
      setIsActive(discount.is_active);
      setIsPermanent(!discount.valid_until);
      setValidUntil(
        discount.valid_until ? new Date(discount.valid_until).toISOString().split('T')[0] : ''
      );
      setErrors({});
    }
  }, [discount]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(discountAmount);
    if (!discountAmount || isNaN(amount)) {
      newErrors.discountAmount = 'Введите корректную скидку';
    } else if (amount < 1 || amount > 100) {
      newErrors.discountAmount = 'Скидка должна быть от 1 до 100%';
    }

    if (!isPermanent) {
      if (!validUntil) {
        newErrors.validUntil = 'Укажите срок действия';
      } else {
        const untilDate = new Date(validUntil);
        const now = new Date();
        if (untilDate <= now) {
          newErrors.validUntil = 'Срок действия должен быть в будущем';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await updateDiscount.mutateAsync({
        id: discount.id,
        discount_amount: parseFloat(discountAmount),
        description: description.trim() || undefined,
        is_active: isActive,
        valid_until: isPermanent ? undefined : validUntil,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update discount:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать скидку</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ID пользователя (только чтение) */}
          <div className="space-y-2">
            <Label>ID пользователя</Label>
            <Input value={discount.user_id} disabled className="font-mono text-xs" />
          </div>

          {/* Тип скидки (только чтение) */}
          <div className="space-y-2">
            <Label>Тип скидки</Label>
            <Input value={discount.discount_type} disabled />
          </div>

          {/* Процент скидки */}
          <div className="space-y-2">
            <Label htmlFor="edit-discount-amount">Процент скидки (%) *</Label>
            <Input
              id="edit-discount-amount"
              type="number"
              min="1"
              max="100"
              placeholder="Например, 10"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
            {errors.discountAmount && (
              <p className="text-sm text-destructive">{errors.discountAmount}</p>
            )}
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              placeholder="Дополнительная информация о скидке"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Активность */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="edit-active" className="font-normal">
              Скидка активна
            </Label>
          </div>

          {/* Срок действия */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-permanent"
                checked={isPermanent}
                onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
              />
              <Label htmlFor="edit-permanent" className="font-normal">
                Бессрочная скидка
              </Label>
            </div>

            {!isPermanent && (
              <div className="space-y-2">
                <Label htmlFor="edit-valid-until">Действует до</Label>
                <Input
                  id="edit-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
                {errors.validUntil && (
                  <p className="text-sm text-destructive">{errors.validUntil}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={updateDiscount.isPending}>
            {updateDiscount.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
