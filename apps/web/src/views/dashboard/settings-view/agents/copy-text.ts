import { m } from '@/paraglide/messages';
import { toast } from 'sonner';

/** Copies to the clipboard; when denied, the text stays selectable */
export async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error(m.mcp_copy_failed());
  }
}
