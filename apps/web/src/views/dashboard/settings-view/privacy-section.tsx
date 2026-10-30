import { UserAPI } from '@/api/user';
import { ConsentSettings } from '@/components/consent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from './settings-section';

/** Tracking choice and data export (GDPR portability). */
export function PrivacySection() {
  const [includeStreams, setIncludeStreams] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const file = await UserAPI.exportData(includeStreams);
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `openathlete-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(m.data_export_failed());
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SettingsSection
      title={m.privacy_section_title()}
      description={m.privacy_section_description()}
    >
      <SettingsPanel>
        <ConsentSettings />
        <div>
          <SettingsRow
            stacked
            title={m.data_export_title()}
            description={m.data_export_description()}
          >
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="size-4" />
              {isExporting
                ? m.data_export_preparing()
                : m.data_export_download()}
            </Button>
          </SettingsRow>
          <Label
            htmlFor="export-streams"
            className="flex min-h-11 items-center gap-2 border-t px-4 py-2 font-normal"
          >
            <Checkbox
              id="export-streams"
              checked={includeStreams}
              onCheckedChange={(checked) => setIncludeStreams(checked === true)}
            />
            {m.data_export_include_streams()}
          </Label>
        </div>
      </SettingsPanel>
    </SettingsSection>
  );
}
