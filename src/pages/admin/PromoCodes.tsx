import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_amount: number;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ code: '', discount_amount: 10, max_uses: '' });
  const [editData, setEditData] = useState<Partial<PromoCode>>({});
  const { toast } = useToast();

  const fetchPromoCodes = async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      setPromoCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleCreate = async () => {
    if (!newCode.code.trim()) {
      toast({ title: 'Ошибка', description: 'Введите код промокода', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('promo_codes').insert({
      code: newCode.code.toUpperCase().trim(),
      discount_amount: newCode.discount_amount,
      max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
    });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Успешно', description: 'Промокод создан' });
      setNewCode({ code: '', discount_amount: 10, max_uses: '' });
      fetchPromoCodes();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      fetchPromoCodes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить промокод?')) return;

    const { error } = await supabase.from('promo_codes').delete().eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Удалено' });
      fetchPromoCodes();
    }
  };

  const startEdit = (promo: PromoCode) => {
    setEditingId(promo.id);
    setEditData({ code: promo.code, discount_amount: promo.discount_amount, max_uses: promo.max_uses });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from('promo_codes')
      .update({
        code: editData.code?.toUpperCase().trim(),
        discount_amount: editData.discount_amount,
        max_uses: editData.max_uses || null,
      })
      .eq('id', editingId);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сохранено' });
      setEditingId(null);
      fetchPromoCodes();
    }
  };

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Создать промокод</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium">Код</label>
              <Input
                placeholder="SALE20"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Скидка %</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newCode.discount_amount}
                onChange={(e) => setNewCode({ ...newCode, discount_amount: parseInt(e.target.value) || 0 })}
                className="w-24"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Макс. использований</label>
              <Input
                type="number"
                placeholder="∞"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                className="w-32"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" /> Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Промокоды ({promoCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Использовано</TableHead>
                <TableHead>Активен</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    {editingId === promo.id ? (
                      <Input
                        value={editData.code || ''}
                        onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                        className="w-32"
                      />
                    ) : (
                      <span className="font-mono font-bold">{promo.code}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === promo.id ? (
                      <Input
                        type="number"
                        value={editData.discount_amount || 0}
                        onChange={(e) => setEditData({ ...editData, discount_amount: parseInt(e.target.value) })}
                        className="w-20"
                      />
                    ) : (
                      <span>{promo.discount_amount}%</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {promo.used_count} / {promo.max_uses || '∞'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={promo.is_active}
                      onCheckedChange={() => handleToggleActive(promo.id, promo.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === promo.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(promo)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(promo.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {promoCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Нет промокодов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
