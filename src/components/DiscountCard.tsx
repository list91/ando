import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserDiscount } from "@/types/discount";
import { isDiscountValid, getDiscountTypeLabel } from "@/lib/discount";
import { Gift, Star, Cake, Award } from "lucide-react";

interface DiscountCardProps {
  discount: UserDiscount;
}

/**
 * Возвращает иконку в зависимости от типа скидки
 */
const getDiscountIcon = (type: UserDiscount['discount_type']) => {
  const iconProps = { className: "h-5 w-5" };

  switch (type) {
    case 'first_order':
      return <Gift {...iconProps} />;
    case 'birthday':
      return <Cake {...iconProps} />;
    case 'loyalty':
      return <Award {...iconProps} />;
    case 'personal':
      return <Star {...iconProps} />;
    default:
      return <Gift {...iconProps} />;
  }
};

/**
 * Форматирует диапазон дат для отображения
 */
const formatDateRange = (validFrom: string, validUntil: string | null): string => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!validUntil) {
    return `С ${formatDate(validFrom)} (бессрочно)`;
  }

  return `С ${formatDate(validFrom)} по ${formatDate(validUntil)}`;
};

export const DiscountCard: React.FC<DiscountCardProps> = ({ discount }) => {
  const isValid = isDiscountValid(discount);
  const typeLabel = getDiscountTypeLabel(discount.discount_type);
  const icon = getDiscountIcon(discount.discount_type);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <span className="text-xl font-bold text-primary">{discount.discount_amount}%</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle className="text-lg">
                  {discount.description || typeLabel}
                </CardTitle>
              </div>
            </div>
          </div>
          <Badge variant={isValid ? "default" : "secondary"}>
            {isValid ? "Активна" : "Истекла"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {formatDateRange(discount.valid_from, discount.valid_until)}
          </p>
          {isValid && (
            <p className="text-sm text-primary">
              Применяется автоматически при оформлении заказа
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Компонент пустого состояния для списка скидок
 */
export const EmptyDiscounts = () => {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">📭</div>
          <div className="space-y-2">
            <p className="text-lg font-medium">У вас пока нет активных скидок</p>
            <p className="text-sm text-muted-foreground">
              Следите за акциями и спецпредложениями!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Компонент скелетона для загрузки
 */
export const DiscountCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-muted animate-pulse rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
};
