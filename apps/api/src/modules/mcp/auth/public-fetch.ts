import { LookupAddress, lookup } from 'node:dns';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';

/**
 * Addresses a request made for someone else must never reach: the server's
 * own network (loopback, private, link-local and cloud metadata ranges).
 */
const BLOCKED = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv6');
}

export function isPublicAddress(address: string): boolean {
  // An IPv4-mapped IPv6 address reaches the IPv4 one. BlockList would also
  // match plain IPv4 addresses against a ::ffff:0:0/96 rule, so unwrap it.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return isPublicAddress(mapped[1]);
  const mappedHex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
  if (mappedHex) {
    const [high, low] = [mappedHex[1], mappedHex[2]].map((part) =>
      parseInt(part, 16),
    );
    return isPublicAddress(
      [high >> 8, high & 255, low >> 8, low & 255].join('.'),
    );
  }
  const family = isIP(address);
  if (!family) return false;
  return !BLOCKED.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

/**
 * Resolves like the system resolver, but fails on any non-public address.
 * The check happens on the address the socket connects to, so a DNS answer
 * cannot change between the check and the connection.
 */
function publicLookup(
  hostname: string,
  options: object,
  callback: (
    error: NodeJS.ErrnoException | null,
    address: string | LookupAddress[],
    family?: number,
  ) => void,
) {
  lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, []);
    const list = addresses as LookupAddress[];
    if (!list.length || list.some(({ address }) => !isPublicAddress(address))) {
      return callback(
        Object.assign(new Error(`${hostname} is not a public address`), {
          code: 'EADDRNOTAVAIL',
        }),
        [],
      );
    }
    const all = (options as { all?: boolean }).all;
    if (all) return callback(null, list);
    callback(null, list[0].address, list[0].family);
  });
}

/**
 * GETs a small JSON document from a public https URL: no redirects, a short
 * timeout and a size limit, since anyone chooses the URL.
 */
export function fetchPublicJson(
  url: URL,
  { timeoutMs = 5000, maxBytes = 64 * 1024 } = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (url.protocol !== 'https:') {
      return reject(new Error('Only https URLs are fetched'));
    }
    const req = request(
      url,
      {
        method: 'GET',
        headers: { accept: 'application/json' },
        lookup: publicLookup as never,
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new Error('Document too large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch {
            reject(new Error('Not a JSON document'));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('Timed out')));
    req.on('error', reject);
    req.end();
  });
}
