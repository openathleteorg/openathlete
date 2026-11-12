import { m } from '@/paraglide/messages';

/** What a workout text issue means, for the person typing */
export function issueMessage(code: string, text?: string): string {
  const word = text ?? '';
  switch (code) {
    case 'unknown_token':
      return m.builder_issue_unknown({ word });
    case 'missing_duration':
      return m.builder_issue_missing_duration();
    case 'duplicate_duration':
      return m.builder_issue_duplicate_duration({ word });
    case 'duplicate_target':
      return m.builder_issue_duplicate_target({ word });
    case 'zone_not_found':
      return m.builder_issue_zone_not_found({ word });
    case 'zone_range':
      return m.builder_issue_zone_range();
    case 'ramp_unsupported':
      return m.builder_issue_ramp();
    case 'repetitions_range':
      return m.builder_issue_repetitions();
    case 'empty_repeat':
      return m.builder_issue_empty_repeat();
    case 'unclosed_paren':
      return m.builder_issue_paren();
    case 'invalid_value':
      return m.builder_issue_invalid_value();
    case 'nested_repeat_expanded':
      return m.builder_issue_nested();
    default:
      return m.builder_issue_ignored();
  }
}
