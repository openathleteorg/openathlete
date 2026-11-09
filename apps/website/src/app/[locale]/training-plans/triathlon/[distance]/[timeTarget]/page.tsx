import {
  PlanRoutePage,
  planMetadata,
  planStaticParams,
} from '@/lib/training-plans/plan-page';

type Props = {
  params: Promise<{ locale: string; distance: string; timeTarget: string }>;
};

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return planStaticParams('triathlon', 'timeTarget');
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale, distance, timeTarget } = await params;
  return planMetadata('triathlon', locale, distance, timeTarget);
}
/* eslint-enable react-refresh/only-export-components */

export default async function Page({ params }: Props) {
  const { locale, distance, timeTarget } = await params;
  return (
    <PlanRoutePage
      sport="triathlon"
      locale={locale}
      distance={distance}
      variant={timeTarget}
    />
  );
}
