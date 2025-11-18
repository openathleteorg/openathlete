interface P {
  label?: string;
  estimatedLoad?: number | null;
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

function formatLoadValue(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }
  return numberFormatter.format(value);
}

export function EstimatedLoadStat({ label, estimatedLoad }: P) {
  return (
    <div className="text-left">
      {label && <div className="text-sm font-semibold">{label}</div>}
      <div>
        {formatLoadValue(estimatedLoad)}{' '}
        <span className="text-gray-500 dark:text-gray-400 text-sm"></span>
      </div>
    </div>
  );
}
