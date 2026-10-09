import {
  useImportFitMutation,
  useImportGpxMutation,
  useImportTcxMutation,
} from '@/api/activity-import';
import { EventDetails } from '@/components/event-details/event-details';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { isAxiosError } from 'axios';
import { Upload } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import {
  ActivityImportWarning,
  ImportedActivityDto,
  MAX_ACTIVITY_FILE_BYTES,
  SPORT_TYPE,
} from '@openathlete/shared';

import {
  ActivityFileKind,
  activityFileKind,
  fileActivityName,
  gpxTrackName,
  tcxActivityName,
} from './activity-file';

type FileResult = {
  fileName: string;
  result?: ImportedActivityDto;
  error?: string;
};

const kindOf = (file: File) => activityFileKind(file.name);
/** GPX and TCX do not always name the sport, so the athlete can. */
const takesSport = (file: File) => kindOf(file) !== 'fit';

const nameFromFile = (file: File) =>
  fileActivityName(file.name) || file.name.slice(0, 100);

/** The name a GPX track or TCX activity stores, else the file name. */
async function suggestedName(file: File) {
  const kind = kindOf(file);
  if (kind === 'fit') return nameFromFile(file);
  const xml = await file.text().catch(() => '');
  const stored = kind === 'gpx' ? gpxTrackName(xml) : tcxActivityName(xml);
  return stored || nameFromFile(file);
}

const isActivityFile = (file: File) =>
  activityFileKind(file.name) !== null &&
  file.size > 0 &&
  file.size <= MAX_ACTIVITY_FILE_BYTES;

function errorText(failure: unknown, kind: ActivityFileKind | null) {
  const status = isAxiosError(failure) ? failure.response?.status : undefined;
  const code = isAxiosError(failure)
    ? failure.response?.data?.message
    : undefined;
  if (
    status === 413 ||
    code === 'FIT_LIMIT' ||
    code === 'GPX_LIMIT' ||
    code === 'TCX_LIMIT'
  )
    return m.fit_import_limit();
  if (
    code === 'FIT_MULTISPORT_UNSUPPORTED' ||
    code === 'TCX_MULTISPORT_UNSUPPORTED'
  )
    return m.fit_import_multisport();
  if (
    code === 'FIT_DUPLICATE_TIME' ||
    code === 'GPX_DUPLICATE_TIME' ||
    code === 'TCX_DUPLICATE_TIME'
  )
    return m.fit_import_duplicate_time();
  if (code === 'GPX_NO_TIME') return m.gpx_import_no_time();
  if (code === 'TCX_NO_TIME') return m.tcx_import_no_time();
  if (status === 403) return m.fit_import_forbidden();
  if (status === 400)
    return kind === 'gpx'
      ? m.gpx_import_invalid()
      : kind === 'tcx'
        ? m.tcx_import_invalid()
        : m.fit_import_invalid();
  return m.fit_import_failed();
}

function warningText(warning: ActivityImportWarning) {
  switch (warning) {
    case 'FIT_INCOMPLETE_CHANNELS':
    case 'GPX_INCOMPLETE_CHANNELS':
    case 'TCX_INCOMPLETE_CHANNELS':
      return m.fit_import_incomplete();
    case 'FIT_NO_STREAM':
    case 'TCX_NO_STREAM':
      return m.fit_import_no_stream();
    case 'FIT_MISSING_SUMMARY':
      return m.fit_import_missing_summary();
    case 'GPX_NO_GPS':
      return m.gpx_import_no_gps();
    case 'TCX_NO_GPS':
      return m.tcx_import_no_gps();
    case 'FIT_UNKNOWN_SPORT':
    case 'GPX_UNKNOWN_SPORT':
    case 'TCX_UNKNOWN_SPORT':
      return m.fit_import_unknown_sport();
  }
}

/**
 * Imports FIT, GPX and TCX files of recorded activities into the athlete's
 * calendar, one request per file. A single file can be renamed; several are
 * named after the name their GPX or TCX stores, or their file. Each file is checked on its
 * own: one failure does not stop the others.
 */
type Props = {
  /** Shows the button that opens the dialog; off when files are dropped */
  trigger?: boolean;
  /** Files dropped on the calendar: opens the dialog with them */
  dropped?: { files: File[]; at: number } | null;
};

export function ImportFitDialog({ trigger = true, dropped }: Props = {}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  // GPX and TCX only: '' keeps the sport each file states.
  const [sport, setSport] = useState<SPORT_TYPE | ''>('');
  const chosenFiles = useRef<File[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const running = useRef(false);
  const [results, setResults] = useState<FileResult[] | null>(null);
  const [viewEventId, setViewEventId] = useState<number | null>(null);
  const importFit = useImportFitMutation();
  const importGpx = useImportGpxMutation();
  const importTcx = useImportTcxMutation();
  const single = files.length === 1;
  const sports = Object.entries(sportTypeLabelMap).sort(([, a], [, b]) =>
    a.localeCompare(b, getLocale()),
  );

  async function chooseFiles(selected: File[]) {
    const valid = selected.filter(isActivityFile);
    chosenFiles.current = valid;
    setSkipped(
      selected.filter((file) => !isActivityFile(file)).map((file) => file.name),
    );
    setFiles(valid);
    setSport('');
    const only = valid.length === 1 ? valid[0] : undefined;
    setName(only ? nameFromFile(only) : '');
    if (!only || kindOf(only) === 'fit') return;
    // Suggest the track name, unless other files were chosen meanwhile.
    const suggested = await suggestedName(only);
    if (chosenFiles.current === valid) setName(suggested);
  }

  // Each drop opens the dialog afresh with its files
  useEffect(() => {
    if (!dropped || running.current) return;
    reset();
    void chooseFiles(dropped.files);
    setOpen(true);
  }, [dropped]);

  function reset() {
    setFiles([]);
    setName('');
    setSport('');
    setSkipped([]);
    setProgress(0);
    setResults(null);
    setViewEventId(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!files.length || running.current) return;
    running.current = true;
    setBusy(true);
    setProgress(0);
    const done: FileResult[] = [];
    for (const [index, file] of files.entries()) {
      try {
        const fileName = single ? name.trim() : await suggestedName(file);
        const kind = kindOf(file);
        const result =
          kind === 'fit'
            ? await importFit.mutateAsync({ file, name: fileName })
            : await (kind === 'gpx' ? importGpx : importTcx).mutateAsync({
                file,
                name: fileName,
                sport: sport || undefined,
              });
        done.push({ fileName: file.name, result });
      } catch (failure) {
        done.push({
          fileName: file.name,
          error: errorText(failure, kindOf(file)),
        });
      }
      setProgress(index + 1);
    }
    setResults(done);
    running.current = false;
    setBusy(false);
  }

  const counts = results && {
    imported: results.filter((r) => r.result && !r.result.alreadyImported)
      .length,
    already: results.filter((r) => r.result?.alreadyImported).length,
    failed: results.filter((r) => r.error).length,
  };

  return (
    <>
      {trigger && (
        <Button
          variant="outline"
          className="min-h-11"
          data-import-fit-trigger
          onClick={() => {
            reset();
            setOpen(true);
          }}
        >
          <Upload className="size-4" />
          {m.fit_import_title()}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!running.current) setOpen(value);
        }}
      >
        <DialogContent className={viewEventId ? 'sm:max-w-6xl' : undefined}>
          <DialogHeader>
            <DialogTitle>{m.fit_import_title()}</DialogTitle>
            <DialogDescription>{m.fit_import_help()}</DialogDescription>
          </DialogHeader>
          {viewEventId ? (
            <EventDetails eventId={viewEventId} />
          ) : results ? (
            <div className="space-y-4">
              {counts && results.length > 1 && (
                <p role="status" className="font-medium">
                  {m.fit_import_summary(counts)}
                </p>
              )}
              <ul className="space-y-3">
                {results.map(({ fileName, result, error }) => (
                  <li
                    key={fileName}
                    className="space-y-1 rounded-md border p-3 text-sm"
                    data-import-result={result ? 'ok' : 'error'}
                  >
                    <p className="font-medium break-words">
                      {result?.name ?? fileName}
                    </p>
                    {result ? (
                      <>
                        <p role="status">
                          {result.alreadyImported
                            ? m.fit_import_already()
                            : m.fit_import_success()}{' '}
                          {new Date(result.startDate).toLocaleString(
                            getLocale(),
                          )}
                        </p>
                        {!result.processingQueued && (
                          <p role="alert">
                            {m.fit_import_processing_pending()}
                          </p>
                        )}
                        {result.warnings.map((warning) => (
                          <p className="text-muted-foreground" key={warning}>
                            {warningText(warning)}
                          </p>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewEventId(result.eventId)}
                        >
                          {m.fit_import_view()}
                        </Button>
                      </>
                    ) : (
                      <p role="alert" className="text-destructive">
                        {error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <DialogFooter>
                <Button variant="outline" onClick={reset}>
                  {m.fit_import_more()}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                <span>{m.fit_import_file()}</span>
                <Input
                  type="file"
                  accept=".fit,.gpx,.tcx,application/vnd.garmin.fit,application/fit,application/gpx+xml,application/vnd.garmin.tcx+xml"
                  multiple
                  // Dropped files are not in the input
                  required={!files.length}
                  disabled={busy}
                  onChange={(event) =>
                    chooseFiles([...(event.target.files ?? [])])
                  }
                />
              </label>
              {files.some(takesSport) && (
                <label className="block space-y-2 text-sm font-medium">
                  <span>{m.sport()}</span>
                  <select
                    name="sport"
                    className="min-h-11 w-full rounded-md border bg-background px-3 text-base text-foreground md:text-sm"
                    value={sport}
                    onChange={(event) =>
                      setSport(event.target.value as SPORT_TYPE | '')
                    }
                    disabled={busy}
                  >
                    <option value="">{m.gpx_import_sport_auto()}</option>
                    {sports.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {m.gpx_import_sport_help()}
                  </span>
                </label>
              )}
              {skipped.length > 0 && (
                <p role="alert" className="text-sm text-destructive">
                  {m.fit_import_skipped({ files: skipped.join(', ') })}
                </p>
              )}
              {single ? (
                <label className="block space-y-2 text-sm font-medium">
                  <span>{m.name()}</span>
                  <Input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={100}
                    disabled={busy}
                  />
                </label>
              ) : (
                files.length > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {m.fit_import_files({ count: files.length })}{' '}
                    {m.fit_import_names_from_files()}
                  </p>
                )
              )}
              {busy && files.length > 1 && (
                <p role="status" className="text-sm">
                  {m.fit_import_progress({
                    done: progress,
                    total: files.length,
                  })}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  {m.cancel()}
                </Button>
                <Button
                  type="submit"
                  disabled={!files.length || (single && !name.trim()) || busy}
                  isLoading={busy}
                >
                  {m.fit_import_submit()}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
