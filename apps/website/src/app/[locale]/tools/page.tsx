import { Container } from '@/components/landing/container';
import { Footer } from '@/components/landing/sections/footer';
import { Navbar } from '@/components/landing/sections/navbar';
import { TopBar } from '@/components/landing/sections/topbar';
import { WebPageStructuredData } from '@/components/seo/structured-data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as generatePageMetadata } from '../../metadata';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    locale,
    title: m.tools_title(),
    description: m.tools_description(),
    path: '/tools',
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const tools = [
    {
      slug: 'vma',
      title: m.tool_vma_title(),
      description: m.tool_vma_description(),
    },
    {
      slug: 'race-predictor',
      title: m.tool_race_predictor_title(),
      description: m.tool_race_predictor_description(),
    },
  ];

  return (
    <>
      <WebPageStructuredData
        title={m.tools_title()}
        description={m.tools_description()}
        url={`${SITE_URL}/${locale}/tools`}
      />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <main className="py-16">
          <Container>
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                {m.tools_title()}
              </h1>
              <p className="text-lg text-muted-foreground">
                {m.tools_description()}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {tools.map((tool) => (
                <Card key={tool.slug} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">
                      {tool.title}
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-end">
                    <Button asChild className="w-full">
                      <Link href={`/${locale}/tools/${tool.slug}`}>
                        {m.tools_use_tool()}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    </>
  );
}
