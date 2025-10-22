import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { EquipmentAPI } from './equipment.api';
import { equipmentKeys } from './equipment.keys';

export const useGetMyEquipmentQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof EquipmentAPI.getMyEquipment>>>,
) => {
  return useQuery({
    ...opt,
    queryKey: [equipmentKeys.getMyEquipment],
    queryFn: EquipmentAPI.getMyEquipment,
  });
};

export const useCreateEquipmentMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EquipmentAPI.createEquipment>>,
    Error,
    Parameters<typeof EquipmentAPI.createEquipment>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EquipmentAPI.createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [equipmentKeys.getMyEquipment] });
    },
  });
};

export const useUpdateEquipmentMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EquipmentAPI.updateEquipment>>,
    Error,
    Parameters<typeof EquipmentAPI.updateEquipment>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EquipmentAPI.updateEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [equipmentKeys.getMyEquipment] });
    },
  });
};

export const useDeleteEquipmentMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EquipmentAPI.deleteEquipment>>,
    Error,
    Parameters<typeof EquipmentAPI.deleteEquipment>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EquipmentAPI.deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [equipmentKeys.getMyEquipment] });
    },
  });
};
