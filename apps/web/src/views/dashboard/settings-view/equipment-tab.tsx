import {
  useCreateEquipmentMutation,
  useDeleteEquipmentMutation,
  useGetMyEquipmentQuery,
  useUpdateEquipmentMutation,
} from '@/api/equipment';
import { EquipmentForm } from '@/components/equipment/equipment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { EQUIPMENT_TYPE, Equipment, SPORT_TYPE } from '@openathlete/shared';

import { SettingsSection } from './settings-section';

export function EquipmentTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  );

  const { data: equipment = [] } = useGetMyEquipmentQuery();
  const createEquipment = useCreateEquipmentMutation();
  const updateEquipment = useUpdateEquipmentMutation();
  const deleteEquipment = useDeleteEquipmentMutation();

  const handleSubmit = async (values: {
    name: string;
    type: EQUIPMENT_TYPE;
    sports: SPORT_TYPE[];
    isDefault: boolean;
  }) => {
    if (editingEquipment) {
      await updateEquipment.mutateAsync({
        id: editingEquipment.equipmentId,
        body: values,
      });
    } else {
      await createEquipment.mutateAsync(values);
    }
    setIsOpen(false);
    setEditingEquipment(null);
  };

  const handleDelete = async (equipmentId: number) => {
    await deleteEquipment.mutateAsync(equipmentId);
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setIsOpen(true);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setEditingEquipment(null);
      }}
    >
      <SettingsSection
        title={m.equipment()}
        description={m.equipment_tab_description()}
        action={
          <DialogTrigger asChild>
            <Button size="sm">{m.add_equipment()}</Button>
          </DialogTrigger>
        }
      >
        {equipment.length === 0 ? (
          <div className="text-sm text-muted-foreground">{m.no_equipment()}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <Card key={item.equipmentId}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item.equipmentId)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {m.type()}
                      </span>
                      <span className="text-sm font-medium">
                        {item.type === EQUIPMENT_TYPE.SHOE ? m.shoe() : m.bike()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {m.total_distance()}
                      </span>
                      <span className="text-sm font-medium">
                        {(item.totalDistance / 1000).toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {m.sports()}
                      </span>
                      <span className="text-sm font-medium">
                        {item.sports
                          .map((sport) => sportTypeLabelMap[sport])
                          .join(', ')}
                      </span>
                    </div>
                    {item.isDefault && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {m.default_equipment()}
                        </span>
                        <span className="text-sm font-medium">✓</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SettingsSection>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingEquipment ? m.edit_equipment() : m.add_equipment()}
          </DialogTitle>
        </DialogHeader>
        <EquipmentForm
          onSubmit={handleSubmit}
          defaultValues={editingEquipment || undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
