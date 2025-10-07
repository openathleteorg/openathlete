import { Map } from '../map/map';
import { useActivityDetailsSelection } from './activity-details-selection-context';

type P = {
  className?: string;
  polyline: number[][];
  pins?: number[][];
  distance?: number[];
  time?: number[];
};

export function ActivityDetailsMap({
  className,
  polyline,
  pins,
  distance,
  time,
}: P) {
  const { domain } = useActivityDetailsSelection();
  let focusPolyline: number[][] | undefined = undefined;
  if (domain && polyline?.length) {
    const [from, to] = domain;
    const series = distance?.length ? distance : time;
    if (series?.length) {
      // lower bound for from
      let lo = 0;
      let hi = series.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (series[mid] < from) lo = mid + 1;
        else hi = mid;
      }
      const startIdx = lo;
      // upper bound for to
      lo = 0;
      hi = series.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (series[mid] > to) hi = mid - 1;
        else lo = mid;
      }
      const endIdx = lo;
      if (startIdx <= endIdx) {
        focusPolyline = polyline.slice(startIdx, endIdx + 1);
      }
    }
  }

  return (
    <Map
      className={className}
      polyline={polyline}
      focusPolyline={focusPolyline}
      pins={pins}
    />
  );
}
