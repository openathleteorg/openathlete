import { ToolPage } from '@/components/tools/tool-page';
import { VmaCalculator } from '@/components/tools/vma-calculator';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/tools/vma',
    title: m.tools_vma_seo_title(),
    description: m.tools_vma_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="vma"
      title={m.tools_vma_h1()}
      lead={m.tools_vma_lead()}
      description={m.tools_vma_seo_description()}
      calculator={<VmaCalculator />}
      method={<p>{m.tools_vma_how_body()}</p>}
      extra={
        <div className="mt-10">
          <h3 className="text-[1.15rem] font-semibold text-ink">
            {m.tools_vma_protocols_title()}
          </h3>
          <ul className="mt-4 space-y-3 text-[0.98rem] leading-relaxed text-[#2b3354]">
            {[
              m.tools_vma_protocol_half(),
              m.tools_vma_protocol_cooper(),
              m.tools_vma_protocol_race(),
            ].map((item) => (
              <li key={item} className="border-l-2 border-sky pl-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      }
      faq={[
        { question: m.tools_vma_faq1_q(), answer: m.tools_vma_faq1_a() },
        { question: m.tools_vma_faq2_q(), answer: m.tools_vma_faq2_a() },
        { question: m.tools_vma_faq3_q(), answer: m.tools_vma_faq3_a() },
      ]}
    />
  );
}
