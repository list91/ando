import { useState, useMemo } from 'react';
import { useAdminDiscounts, useDeleteDiscount } from '@/hooks/useUserDiscounts';
import { isDiscountValid, getDiscountTypeLabel } from '@/lib/discount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddDiscountDialog } from '@/components/admin/AddDiscountDialog';
import { EditDiscountDialog } from '@/components/admin/EditDiscountDialog';
import { DeleteDiscountConfirm } from '@/components/admin/DeleteDiscountConfirm';
import type { UserDiscount, DiscountType } from '@/types/discount';

const AdminUserDiscounts = () => {
  const { data: discounts, isLoading } = useAdminDiscounts();
  const deleteDiscount = useDeleteDiscount();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DiscountType | 'all'>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<UserDiscount | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<UserDiscount | null>(null);

  const filteredDiscounts = useMemo(() => {
    if (!discounts) return [];

    return discounts.filter((d) => {
      // Поиск по email пользователя
      if (searchQuery && !d.user_email?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Фильтр по типу
      if (filterType !== 'all' && d.discount_type !== filterType) {
        return false;
      }

      // Фильтр только активные
      if (showActiveOnly && !isDiscountValid(d)) {
        return false;
      }

      return true;
    });
  }, [discounts, searchQuery, filterType, showActiveOnly]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Бессрочно';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;
    await deleteDiscount.mutateAsync(deletingDiscount.id);
    setDeletingDiscount(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Управление скидками клиентов</CardTitle>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить скидку
          </Button>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as DiscountType | 'all')}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Тип скидки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="first_order">Первый заказ</SelectItem>
                <SelectItem value="personal">Персональная</SelectItem>
                <SelectItem value="birthday">День рождения</SelectItem>
                <SelectItem value="loyalty">Лояльность</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={(checked) => setShowActiveOnly(checked as boolean)}
              />
              <label
                htmlFor="active-only"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Только активные
              </label>
            </div>
          </div>

          {/* Таблица */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email пользователя</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Скидка</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Срок действия</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                      {searchQuery || filterType !== 'all' || showActiveOnly
                        ? 'Скидки не найдены'
                        : 'Скидки еще не добавлены'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="text-sm">
                        {discount.user_email || '—'}
                      </TableCell>
                      <TableCell>{getDiscountTypeLabel(discount.discount_type)}</TableCell>
                      <TableCell className="font-semibold">{discount.discount_amount}%</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {discount.description || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>с {formatDate(discount.valid_from)}</div>
                          {discount.valid_until && (
                            <div className="text-muted-foreground">
                              до {formatDate(discount.valid_until)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isDiscountValid(discount) ? (
                          <Badge variant="default">Активна</Badge>
                        ) : (
                          <Badge variant="secondary">Неактивна</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingDiscount(discount)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingDiscount(discount)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Статистика */}
          <div className="mt-4 text-sm text-muted-foreground">
            Показано скидок: {filteredDiscounts.length} из {discounts?.length || 0}
          </div>
        </CardContent>
      </Card>

      {/* Диалоги */}
      <AddDiscountDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {editingDiscount && (
        <EditDiscountDialog
          open={!!editingDiscount}
          onOpenChange={(open) => !open && setEditingDiscount(null)}
          discount={editingDiscount}
        />
      )}

      {deletingDiscount && (
        <DeleteDiscountConfirm
          open={!!deletingDiscount}
          onOpenChange={(open) => !open && setDeletingDiscount(null)}
          discount={deletingDiscount}
          onConfirm={handleDelete}
          isDeleting={deleteDiscount.isPending}
        />
      )}
    </div>
  );
};

export default AdminUserDiscounts;
