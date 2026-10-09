import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreatePersonalTokenDto,
  OAuthAuthorizeRequest,
} from '@openathlete/shared';

import { McpAPI } from './mcp.api';
import { mcpKeys } from './mcp.keys';

export function useMcpInfoQuery() {
  return useQuery({
    queryKey: mcpKeys.info(),
    queryFn: McpAPI.getInfo,
    // Set by the deployment
    staleTime: Infinity,
  });
}

export function useMcpConnectionsQuery() {
  return useQuery({
    queryKey: mcpKeys.connections(),
    queryFn: McpAPI.getConnections,
  });
}

export function useCreatePersonalTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePersonalTokenDto) =>
      McpAPI.createPersonalToken(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: mcpKeys.connections() }),
  });
}

export function useRevokeMcpConnectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mcpGrantId: number) => McpAPI.revokeConnection(mcpGrantId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: mcpKeys.connections() }),
  });
}

/** What the consent page shows; an invalid request fails once, for good */
export function useOAuthAuthorizeDetailsQuery(request: OAuthAuthorizeRequest) {
  return useQuery({
    queryKey: mcpKeys.authorize(JSON.stringify(request)),
    queryFn: () => McpAPI.getAuthorizeDetails(request),
    retry: false,
    staleTime: Infinity,
  });
}

export function useOAuthDecisionMutation() {
  return useMutation({
    mutationFn: ({
      request,
      approve,
    }: {
      request: OAuthAuthorizeRequest;
      approve: boolean;
    }) => McpAPI.decide(request, approve),
  });
}
