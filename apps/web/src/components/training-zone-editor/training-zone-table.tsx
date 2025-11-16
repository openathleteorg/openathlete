import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { useMemo } from 'react';

import {
  SPORT_TYPE,
  TrainingZone,
  TrainingZoneValue,
} from '@openathlete/shared';

interface TrainingZoneTableProps {
  zones: (TrainingZone & { values: TrainingZoneValue[] })[];
  onDelete?: (zoneId: number) => void;
}

export function TrainingZoneTable({ zones }: TrainingZoneTableProps) {
  const displayData = useMemo(() => {
    const sportConfigs = new Map<
      string,
      {
        zone: TrainingZone & { values: TrainingZoneValue[] };
        value: TrainingZoneValue;
      }[]
    >();

    zones.forEach((zone) => {
      zone.values.forEach((value: TrainingZoneValue) => {
        const key = value.sports.sort().join(',');
        if (!sportConfigs.has(key)) {
          sportConfigs.set(key, []);
        }
        sportConfigs.get(key)!.push({
          zone,
          value,
        });
      });
    });

    return Array.from(sportConfigs.entries()).map(([sportKey, items]) => ({
      sports: sportKey.split(',').filter(Boolean) as SPORT_TYPE[],
      zones: items,
    }));
  }, [zones]);

  const allSports = Object.values(SPORT_TYPE);
  return (
    <div className="space-y-4">
      {displayData.map((config, configIdx) => {
        const isAllSports =
          config.sports.length === allSports.length &&
          config.sports.every((s) => allSports.includes(s));
        const sportsLabel = isAllSports
          ? m.all_sports()
          : config.sports.map((s) => sportTypeLabelMap[s]).join(', ');

        return (
          <div key={configIdx} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {sportsLabel}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.zone()}</TableHead>
                  <TableHead>{m.name()}</TableHead>
                  <TableHead>{m.description()}</TableHead>
                  <TableHead className="text-right">{m.min()}</TableHead>
                  <TableHead className="text-right">{m.max()}</TableHead>
                  <TableHead>{m.color()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.zones.map(
                  (
                    item: {
                      zone: TrainingZone & { values: TrainingZoneValue[] };
                      value: TrainingZoneValue;
                    },
                    idx: number,
                  ) => {
                    // Check if this is the last zone in the entire zones array
                    const isLastZone =
                      config.zones.length === zones.length &&
                      idx === config.zones.length - 1;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.zone.index + 1}
                        </TableCell>
                        <TableCell>{item.zone.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.zone.description}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.value.min}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.value.max}
                          {isLastZone && (
                            <span className="text-xs text-muted-foreground ml-1">
                              +
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: item.zone.color }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
