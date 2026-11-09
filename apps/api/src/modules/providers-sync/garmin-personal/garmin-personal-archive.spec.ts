import AdmZip from 'adm-zip';

import { MAX_ACTIVITY_FILE_BYTES } from '@openathlete/shared';

import { extractPersonalFit } from './garmin-personal-service';

jest.mock('@garmin/fitsdk', () => ({}));

const archive = (...names: string[]) => {
  const zip = new AdmZip();
  names.forEach((name) => zip.addFile(name, Buffer.from('synthetic FIT')));
  return zip.toBuffer();
};
describe('Personal API ZIP boundary', () => {
  it('reads a single FIT without extracting paths onto disk', () => {
    expect(
      extractPersonalFit(archive('../../ride.FIT', 'readme.txt')).toString(),
    ).toBe('synthetic FIT');
  });
  it.each([
    Buffer.from('invalid'),
    archive('readme.txt'),
    archive('a.fit', 'b.fit'),
    archive(
      ...Array.from({ length: 17 }, (_, i) => (i === 0 ? 'a.fit' : `${i}.txt`)),
    ),
  ])('rejects corrupt, missing, ambiguous or excessive entries', (value) => {
    expect(() => extractPersonalFit(value)).toThrow('invalid_response');
  });
  it('rejects a declared FIT larger than the import limit before decompression', () => {
    const zip = archive('a.fit');
    const central = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    zip.writeUInt32LE(MAX_ACTIVITY_FILE_BYTES + 1, central + 24);
    expect(() => extractPersonalFit(zip)).toThrow('invalid_response');
  });
  it('rejects deflated data larger than its declared size', () => {
    const zip = archive('a.fit');
    const central = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    zip.writeUInt32LE(1, central + 24);
    expect(() => extractPersonalFit(zip)).toThrow('invalid_response');
  });
});
