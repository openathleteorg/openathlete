import { useMcpInfoQuery } from '@/api/mcp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { m } from '@/paraglide/messages';
import { Copy } from 'lucide-react';

import { SettingsSection } from '../settings-section';
import { copyText } from './copy-text';

function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-sm border bg-muted p-3 font-mono text-xs text-muted-foreground select-all">
      {children}
    </pre>
  );
}

/** Where agents connect, and how to add it to the common ones */
export function McpServerSection() {
  const { data: info, isLoading } = useMcpInfoQuery();
  const url = info?.url ?? '';

  return (
    <SettingsSection
      title={m.mcp_server_title()}
      description={m.mcp_server_description()}
      contentClassName="space-y-4 pt-4"
    >
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className="min-w-0 flex-1 break-all rounded-sm border bg-muted p-3 font-mono text-sm text-muted-foreground select-all"
            data-mcp-url
          >
            {url}
          </div>
          <Button
            variant="outline"
            onClick={() => copyText(url, m.mcp_address_copied())}
          >
            <Copy className="size-4" />
            {m.copy()}
          </Button>
        </div>
      )}

      <Tabs defaultValue="claude">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="claude">Claude</TabsTrigger>
          <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
          <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
          <TabsTrigger value="other">{m.mcp_setup_other_tab()}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="claude"
          className="pt-2 text-sm text-muted-foreground"
        >
          {m.mcp_setup_claude()}
        </TabsContent>
        <TabsContent
          value="chatgpt"
          className="pt-2 text-sm text-muted-foreground"
        >
          {m.mcp_setup_chatgpt()}
        </TabsContent>
        <TabsContent
          value="claude-code"
          className="space-y-2 pt-2 text-sm text-muted-foreground"
        >
          <p>{m.mcp_setup_claude_code()}</p>
          <Snippet>{`claude mcp add --transport http openathlete ${url}`}</Snippet>
        </TabsContent>
        <TabsContent
          value="other"
          className="space-y-2 pt-2 text-sm text-muted-foreground"
        >
          <p>{m.mcp_setup_other()}</p>
          <Snippet>
            {JSON.stringify(
              {
                mcpServers: {
                  openathlete: {
                    url,
                    headers: { Authorization: 'Bearer oa_pat_…' },
                  },
                },
              },
              null,
              2,
            )}
          </Snippet>
        </TabsContent>
      </Tabs>
    </SettingsSection>
  );
}
