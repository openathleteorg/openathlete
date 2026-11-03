import {
  PlanRoutePage,
  planMetadata,
  planStaticParams,
} from '@/lib/training-plans/plan-page';

type Props = {
  params: Promise<{ locale: string; distance: string; elevationRange: string }>;
};

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return planStaticParams('trail', 'elevationRange');
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale, distance, elevationRange } = await params;
  return planMetadata('trail', locale, distance, elevationRange);
}
/* eslint-enable react-refresh/only-export-components */

export default async function Page({ params }: Props) {
  const { locale, distance, elevationRange } = await params;
  return (
    <PlanRoutePage
      sport="trail"
      locale={locale}
      distance={distance}
      variant={elevationRange}
    />
  );
}
