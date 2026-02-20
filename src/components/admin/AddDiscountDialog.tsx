import { useState } from 'react';
import { useCreateDiscount, useFindUserByEmail } from '@/hooks/useUserDiscounts';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { DiscountType } from '@/types/discount';

interface AddDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddDiscountDialog = ({ open, onOpenChange }: AddDiscountDialogProps) => {
  const createDiscount = useCreateDiscount();
  const findUser = useFindUserByEmail();

  const [userEmail, setUserEmail] = useState('');
  const [foundUser, setFoundUser] = useState<{ id: string; email: string } | null>(null);
  const [discountType, setDiscountType] = useState<DiscountType>('personal');
  const [discountAmount, setDiscountAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);
  const [validUntil, setValidUntil] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSearchUser = async () => {
    if (!userEmail.trim()) {
      setErrors((prev) => ({ ...prev, userEmail: 'Введите email' }));
      return;
    }

    setErrors((prev) => ({ ...prev, userEmail: '' }));

    try {
      const user = await findUser.mutateAsync(userEmail);
      if (user) {
        setFoundUser(user);
        setErrors((prev) => ({ ...prev, userEmail: '' }));
      } else {
        setFoundUser(null);
        setErrors((prev) => ({ ...prev, userEmail: 'Пользователь не найден' }));
      }
    } catch (error) {
      setFoundUser(null);
      setErrors((prev) => ({ ...prev, userEmail: 'Ошибка поиска' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!foundUser) {
      newErrors.userEmail = 'Сначала найдите пользователя по email';
    }

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
    if (!validate() || !foundUser) return;

    try {
      await createDiscount.mutateAsync({
        user_id: foundUser.id,
        discount_type: discountType,
        discount_amount: parseFloat(discountAmount),
        description: description.trim() || undefined,
        valid_until: isPermanent ? undefined : validUntil,
      });

      // Сброс формы
      setUserEmail('');
      setFoundUser(null);
      setDiscountType('personal');
      setDiscountAmount('');
      setDescription('');
      setIsPermanent(true);
      setValidUntil('');
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create discount:', error);
    }
  };

  const handleEmailChange = (value: string) => {
    setUserEmail(value);
    setFoundUser(null); // Сбрасываем найденного пользователя при изменении email
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить скидку</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email пользователя */}
          <div className="space-y-2">
            <Label htmlFor="user-email">Email пользователя *</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="user-email"
                  type="email"
                  placeholder="example@email.com"
                  value={userEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                />
                {foundUser && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {errors.userEmail && !findUser.isPending && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSearchUser}
                disabled={findUser.isPending}
              >
                {findUser.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Найти'
                )}
              </Button>
            </div>
            {errors.userEmail && <p className="text-sm text-destructive">{errors.userEmail}</p>}
            {foundUser && (
              <p className="text-sm text-green-600">
                Найден: {foundUser.email}
              </p>
            )}
          </div>

          {/* Тип скидки */}
          <div className="space-y-2">
            <Label htmlFor="discount-type">Тип скидки</Label>
            <Select
              value={discountType}
              onValueChange={(value) => setDiscountType(value as DiscountType)}
            >
              <SelectTrigger id="discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_order">Скидка на первый заказ</SelectItem>
                <SelectItem value="personal">Персональная скидка</SelectItem>
                <SelectItem value="birthday">Скидка на день рождения</SelectItem>
                <SelectItem value="loyalty">Программа лояльности</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Процент скидки */}
          <div className="space-y-2">
            <Label htmlFor="discount-amount">Процент скидки (%) *</Label>
            <Input
              id="discount-amount"
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
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Дополнительная информация о скидке"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Срок действия */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permanent"
                checked={isPermanent}
                onCheckedChange={(checked) => setIsPermanent(checked as boolean)}
              />
              <Label htmlFor="permanent" className="font-normal">
                Бессрочная скидка
              </Label>
            </div>

            {!isPermanent && (
              <div className="space-y-2">
                <Label htmlFor="valid-until">Действует до</Label>
                <Input
                  id="valid-until"
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
          <Button onClick={handleSubmit} disabled={createDiscount.isPending || !foundUser}>
            {createDiscount.isPending ? 'Создание...' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
