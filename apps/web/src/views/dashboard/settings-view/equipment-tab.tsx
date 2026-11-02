import {
  useCreateEquipmentMutation,
  useDeleteEquipmentMutation,
  useGetMyEquipmentQuery,
  useUpdateEquipmentMutation,
} from '@/api/equipment';
import { ConfirmAction } from '@/components/confirm-action';
import { EquipmentForm } from '@/components/equipment/equipment-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { Bike, Footprints, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { EQUIPMENT_TYPE, Equipment, SPORT_TYPE } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from './settings-section';

export function EquipmentTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<number | null>(
    null,
  );

  const { data: equipment = [], isPending: isLoadingEquipment } =
    useGetMyEquipmentQuery();
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

  const handleDeleteClick = (equipmentId: number) => {
    setEquipmentToDelete(equipmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (equipmentToDelete !== null) {
      await deleteEquipment.mutateAsync(equipmentToDelete);
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
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
        action={
          <DialogTrigger asChild>
            <Button size="sm">{m.add_equipment()}</Button>
          </DialogTrigger>
        }
      >
        {isLoadingEquipment ? (
          <SettingsRowsSkeleton count={3} />
        ) : equipment.length === 0 ? (
          <SettingsEmpty>{m.no_equipment()}</SettingsEmpty>
        ) : (
          <SettingsPanel>
            {equipment.map((item) => {
              const isShoe = item.type === EQUIPMENT_TYPE.SHOE;
              const Icon = isShoe ? Footprints : Bike;
              return (
                <SettingsRow
                  key={item.equipmentId}
                  leading={<Icon className="size-5" />}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {item.name}
                      {item.isDefault && (
                        <Badge variant="secondary">
                          {m.default_equipment()}
                        </Badge>
                      )}
                    </span>
                  }
                  description={[
                    isShoe ? m.shoe() : m.bike(),
                    item.sports
                      .map((sport) => sportTypeLabelMap[sport])
                      .join(', '),
                    `${(item.totalDistance / 1000).toFixed(1)} km`,
                  ].join(' · ')}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-md:w-11"
                    aria-label={`${m.edit_equipment()} ${item.name}`}
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-md:w-11"
                    aria-label={`${m.delete_equipment()} ${item.name}`}
                    onClick={() => handleDeleteClick(item.equipmentId)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </SettingsRow>
              );
            })}
          </SettingsPanel>
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
          isLoading={createEquipment.isPending || updateEquipment.isPending}
        />
      </DialogContent>
      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setEquipmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={m.delete_equipment()}
        message={m.confirm_delete_equipment()}
        isLoading={deleteEquipment.isPending}
      />
    </Dialog>
  );
}
