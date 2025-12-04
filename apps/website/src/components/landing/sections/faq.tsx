import { Container } from '@/components/landing/container';
import { FAQItem } from '@/components/landing/faq-item';
import { Section } from '@/components/landing/section';
import { FAQPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';

interface FAQProps {
  locale?: string;
}

export function FAQ({ locale = 'en' }: FAQProps) {
  const faqs = [
    {
      question: m.landing_faq_item_1_q(),
      answer: m.landing_faq_item_1_a(),
    },
    {
      question: m.landing_faq_item_2_q(),
      answer: m.landing_faq_item_2_a(),
    },
    {
      question: m.landing_faq_item_3_q(),
      answer: m.landing_faq_item_3_a(),
    },
    {
      question: m.landing_faq_item_4_q(),
      answer: m.landing_faq_item_4_a(),
    },
    {
      question: m.landing_faq_item_5_q(),
      answer: m.landing_faq_item_5_a(),
    },
  ];

  const faqUrl = `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}#faq`;

  return (
    <>
      <FAQPageStructuredData faqs={faqs} url={faqUrl} />
      <Section id="faq">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {m.landing_faq_title()}
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
