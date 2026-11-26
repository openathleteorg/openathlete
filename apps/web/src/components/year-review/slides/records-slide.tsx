import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { CSSProperties } from 'react';

import { YearReviewRecordDto } from '@openathlete/shared';

import { formatNumber, monthName } from '../format';
import { recordGain, recordLabel, recordValue } from '../records';
import { after } from '../story/after';
import { CountUp } from '../story/count-up';
import { Eyebrow, Slide, Title } from '../story/slide';
import { SlideProps } from './types';

const FAMILY_COLORS: Record<YearReviewRecordDto['family'], string> = {
  RUN: 'var(--yr-coral)',
  RIDE: 'var(--yr-sky)',
  SWIM: 'var(--yr-mint)',
};

export function RecordsSlide({ review }: SlideProps) {
  const units = useUnits();
  const { highlights, improved } = review.records;
  return (
    <Slide>
      <Eyebrow>{m.year_review_records_eyebrow()}</Eyebrow>
      <Title accent={m.year_review_records_accent()}>
        {m.year_review_records_title()}
      </Title>
      <ul className="yr-records">
        {highlights.map((record, index) => {
          const gain = recordGain(record);
          return (
            <li
              key={`${record.family}-${record.distance}-${record.duration}`}
              className="yr-record yr-reveal"
              style={
                {
                  ...after(300 + index * 120),
                  '--c': FAMILY_COLORS[record.family],
                } as CSSProperties
              }
            >
              <div>
                <p className="yr-record-kind">
                  {recordLabel(record, units.unitSystem)}
                </p>
                <p className="yr-record-value">{recordValue(record)}</p>
              </div>
              <p className="yr-record-foot">
                <span className="yr-chip">
                  {gain ?? m.year_review_record_first()}
                </span>
                {monthName(record.date.getMonth())}
              </p>
            </li>
          );
        })}
      </ul>
      {/* One record says it all on its own card */}
      {improved > 1 && (
        <p className="yr-closing yr-push yr-reveal" style={after(900)}>
          <b>
            <CountUp
              value={improved}
              format={(value) => formatNumber(Math.round(value))}
            />
          </b>
          {m.year_review_records_closing()}
        </p>
      )}
    </Slide>
  );
}
