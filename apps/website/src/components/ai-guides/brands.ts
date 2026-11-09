import { DOCS_URL } from '@/config';
import { m } from '@/paraglide/messages';

type Message = () => string;

export interface GuideBrand {
  id: 'claude' | 'chatgpt';
  name: string;
  company: string;
  path: string;
  other: 'claude' | 'chatgpt';
  seoTitle: Message;
  seoDescription: Message;
  title: Message;
  crumb: Message;
  heroNote: Message;
  step3Title: Message;
  step3Body: Message;
  step3Team: Message;
  step5Body: Message;
  plansTitle: Message;
  plans: Message[];
  revoke: Message;
  finalTitle: Message;
  faqs: Array<[Message, Message]>;
  sources: Array<{ label: string; href: string }>;
}

const OPENATHLETE_DOCS = {
  get label() {
    return m.aig_source_docs();
  },
  href: `${DOCS_URL}/docs/guides/ai-agents`,
};

export const GUIDE_BRANDS: Record<GuideBrand['id'], GuideBrand> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    path: '/ai/claude',
    other: 'chatgpt',
    seoTitle: m.aig_claude_seo_title,
    seoDescription: m.aig_claude_seo_description,
    title: m.aig_claude_title,
    crumb: m.aig_claude_crumb,
    heroNote: m.aig_claude_hero_note,
    step3Title: m.aig_claude_step3_title,
    step3Body: m.aig_claude_step3_body,
    step3Team: m.aig_claude_step3_team,
    step5Body: m.aig_claude_step5_body,
    plansTitle: m.aig_claude_plans_title,
    plans: [m.aig_claude_plans_1, m.aig_claude_plans_2, m.aig_claude_plans_3],
    revoke: m.aig_claude_revoke,
    finalTitle: m.aig_claude_final_title,
    faqs: [
      [m.aig_claude_faq_1_q, m.aig_claude_faq_1_a],
      [m.aig_claude_faq_2_q, m.aig_claude_faq_2_a],
      [m.aig_claude_faq_3_q, m.aig_claude_faq_3_a],
      [m.aig_claude_faq_4_q, m.aig_claude_faq_4_a],
      [m.aig_claude_faq_5_q, m.aig_claude_faq_5_a],
      [m.aig_claude_faq_6_q, m.aig_claude_faq_6_a],
      [m.aig_claude_faq_7_q, m.aig_claude_faq_7_a],
    ],
    sources: [
      {
        label:
          'Claude Help Center: Getting started with custom connectors using remote MCP',
        href: 'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
      },
      {
        label: 'Claude Help Center: Pre-built web connectors using remote MCP',
        href: 'https://support.claude.com/en/articles/11176164-pre-built-web-connectors-using-remote-mcp',
      },
      {
        label: 'Claude Code docs: Connect Claude Code to tools via MCP',
        href: 'https://code.claude.com/docs/en/mcp',
      },
      OPENATHLETE_DOCS,
    ],
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    company: 'OpenAI',
    path: '/ai/chatgpt',
    other: 'claude',
    seoTitle: m.aig_chatgpt_seo_title,
    seoDescription: m.aig_chatgpt_seo_description,
    title: m.aig_chatgpt_title,
    crumb: m.aig_chatgpt_crumb,
    heroNote: m.aig_chatgpt_hero_note,
    step3Title: m.aig_chatgpt_step3_title,
    step3Body: m.aig_chatgpt_step3_body,
    step3Team: m.aig_chatgpt_step3_team,
    step5Body: m.aig_chatgpt_step5_body,
    plansTitle: m.aig_chatgpt_plans_title,
    plans: [
      m.aig_chatgpt_plans_1,
      m.aig_chatgpt_plans_2,
      m.aig_chatgpt_plans_3,
    ],
    revoke: m.aig_chatgpt_revoke,
    finalTitle: m.aig_chatgpt_final_title,
    faqs: [
      [m.aig_chatgpt_faq_1_q, m.aig_chatgpt_faq_1_a],
      [m.aig_chatgpt_faq_2_q, m.aig_chatgpt_faq_2_a],
      [m.aig_chatgpt_faq_3_q, m.aig_chatgpt_faq_3_a],
      [m.aig_chatgpt_faq_4_q, m.aig_chatgpt_faq_4_a],
      [m.aig_chatgpt_faq_5_q, m.aig_chatgpt_faq_5_a],
      [m.aig_chatgpt_faq_6_q, m.aig_chatgpt_faq_6_a],
      [m.aig_chatgpt_faq_7_q, m.aig_chatgpt_faq_7_a],
    ],
    sources: [
      {
        label: 'OpenAI Help Center: Creating custom MCP apps in ChatGPT',
        href: 'https://help.openai.com/en/articles/12584461-creating-custom-mcp-apps-in-chatgpt',
      },
      {
        label: 'OpenAI developers: Add a custom MCP server',
        href: 'https://developers.openai.com/api/docs/guides/custom-mcp-server',
      },
      {
        label: 'OpenAI Apps SDK: Connect from ChatGPT',
        href: 'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt',
      },
      OPENATHLETE_DOCS,
    ],
  },
};
