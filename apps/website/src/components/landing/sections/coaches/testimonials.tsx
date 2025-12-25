import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { TestimonialCard } from '@/components/landing/testimonial-card';
import { m } from '@/paraglide/messages';

export function CoachesTestimonials() {
  const testimonials = [
    {
      quote: m.coaches_testimonials_item_1_quote(),
      author: m.coaches_testimonials_item_1_author(),
      role: m.coaches_testimonials_item_1_role(),
    },
    {
      quote: m.coaches_testimonials_item_2_quote(),
      author: m.coaches_testimonials_item_2_author(),
      role: m.coaches_testimonials_item_2_role(),
    },
    {
      quote: m.coaches_testimonials_item_3_quote(),
      author: m.coaches_testimonials_item_3_author(),
      role: m.coaches_testimonials_item_3_role(),
    },
  ];

  return (
    <Section id="testimonials" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.coaches_testimonials_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
