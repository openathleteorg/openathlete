import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { eventTemplateKeys } from '../event-template/event-template.keys';
import { EventTemplateFolderAPI } from './event-template-folder.api';
import { eventTemplateFolderKeys } from './event-template-folder.keys';

export const useGetMyFoldersQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventTemplateFolderAPI.getMyFolders>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: EventTemplateFolderAPI.getMyFolders,
    queryKey: [eventTemplateFolderKeys.getMyFolders],
  });

export const useCreateFolderMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateFolderAPI.createFolder>>,
    Error,
    Parameters<typeof EventTemplateFolderAPI.createFolder>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateFolderAPI.createFolder,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateFolderKeys.getMyFolders],
      });
    },
  });
};

export const useUpdateFolderMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateFolderAPI.updateFolder>>,
    Error,
    Parameters<typeof EventTemplateFolderAPI.updateFolder>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateFolderAPI.updateFolder,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateFolderKeys.getMyFolders],
      });
    },
  });
};

export const useDeleteFolderMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateFolderAPI.deleteFolder>>,
    Error,
    Parameters<typeof EventTemplateFolderAPI.deleteFolder>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateFolderAPI.deleteFolder,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateFolderKeys.getMyFolders],
      });
      queryClient.invalidateQueries({
        queryKey: [eventTemplateKeys.getMyEventTemplates],
      });
    },
  });
};
