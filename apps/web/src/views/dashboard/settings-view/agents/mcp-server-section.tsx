import { useMcpInfoQuery } from '@/api/mcp';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { m } from '@/paraglide/messages';

import {
  SettingsCopyField,
  SettingsPanel,
  SettingsSection,
} from '../settings-section';
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
    >
      <SettingsPanel padded className="space-y-4 divide-y-0">
        {isLoading ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <SettingsCopyField
            value={url}
            onCopy={() => copyText(url, m.mcp_address_copied())}
            data-mcp-url
          />
        )}

        <Tabs defaultValue="claude">
          <TabsList className="grid w-full grid-cols-2 max-md:h-auto! sm:grid-cols-4">
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
      </SettingsPanel>
    </SettingsSection>
  );
}
