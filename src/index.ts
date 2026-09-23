import damerau from 'levenshtein-lte1/damerau.js';
import catalog from './catalog.json';
import { commonModels, fuzzyStopWords, highRiskCommonModels, makeAliases } from './rules.js';

export type MatchType = 'exact' | 'alias' | 'fuzzy';

/** Full evidence for one detected vehicle-model mention. */
export interface VehicleMatch {
  /** Canonical model name from the bundled vehicle catalog. */
  model: string;
  /** Every catalog-supported possible make for this model in the detected context. */
  makes: string[];
  /** Exact text slice that produced this match. */
  matchedText: string;
  /** UTF-16 start offset in the original input string. */
  start: number;
  /** Exclusive UTF-16 end offset in the original input string. */
  end: number;
  /** How the input matched the catalog model. */
  matchType: MatchType;
}

/** Minimal make/model pair for a detected vehicle possibility. */
export interface CompactVehicleMatch {
  /** Possible vehicle make. */
  make: string;
  /** Canonical model name from the bundled vehicle catalog. */
  model: string;
}

export type VehicleOutput = 'detailed' | 'compact';

export interface FindOptions<TOutput extends VehicleOutput = 'detailed'> {
  /** Enable single-edit typo matching. Defaults to `true`. */
  fuzzy?: boolean;
  /**
   * Controls the returned result shape.
   *
   * - `detailed` (default): returns full match evidence including possible makes,
   *   source text, offsets, and match type.
   * - `compact`: returns one `{ make, model }` object for each possible vehicle.
   *   Ambiguous models produce multiple make/model pairs.
   */
  output?: TOutput;
}

export type FindVehiclesResult<TOutput extends VehicleOutput> = TOutput extends 'compact'
  ? CompactVehicleMatch[]
  : VehicleMatch[];

function validateOptions(options: FindOptions<VehicleOutput> | undefined): void {
  if (
    options !== undefined &&
    (options === null ||
      typeof options !== 'object' ||
      Array.isArray(options) ||
      (options.fuzzy !== undefined && typeof options.fuzzy !== 'boolean') ||
      (options.output !== undefined && options.output !== 'detailed' && options.output !== 'compact'))
  ) {
    throw new TypeError('options must contain only supported fuzzy/output values');
  }
}

interface Token {
  value: string;
  start: number;
  end: number;
}
interface Entry {
  model: string;
  makes: readonly string[];
  key: string;
  surface: string;
  family: boolean;
  boundaries: Set<number>;
  punctuation: Map<number, string>;
  suffix: string;
  words: string[];
}
interface Group {
  from: number;
  to: number;
  matches: VehicleMatch[];
  usedMake: number[];
  qualified: boolean;
}
interface MakeMention {
  from: number;
  to: number;
  make: string;
}

const words = /[\p{L}\p{M}\p{N}_]+/gu;
const normalize = (value: string): string => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const surface = (value: string): string =>
  normalize(value)
    .replace(/\p{Pd}/gu, '-')
    .replace(/\s+/gu, ' ')
    .trim();
const compact = (value: string): string => normalize(value).replace(/[^a-z0-9]/g, '');
const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// All indexes contain catalog strings only. User input is never cached between calls.
const index = new Map<string, Entry[]>();
const prefixes = new Set<string>();
const deletionIndex = new Map<string, Set<Entry>>();
const makeIndex = new Map<string, string>();
let maxKeyLength = 0;
let maxWindow = 0;

for (const row of [
  ...catalog.models.map((row) => ({ ...row, family: false })),
  ...catalog.families.map((row) => ({ ...row, family: true })),
]) {
  const parts = [...row.model.matchAll(words)];
  let position = 0;
  const boundaries = new Set<number>();
  const punctuation = new Map<number, string>();
  for (let i = 0; i < parts.length; i++) {
    position += normalize(parts[i][0]).length;
    if (i < parts.length - 1) {
      boundaries.add(position);
      punctuation.set(position, row.model.slice(parts[i].index! + parts[i][0].length, parts[i + 1].index));
    }
  }
  const key = compact(row.model);
  for (let i = 1; i < key.length; i++) {
    if (/\d/.test(key[i - 1]) !== /\d/.test(key[i])) boundaries.add(i);
  }
  const entry: Entry = {
    model: row.model,
    makes: row.makes,
    key,
    surface: surface(row.model),
    family: row.family,
    boundaries,
    punctuation,
    suffix: row.model.slice(parts.at(-1)!.index! + parts.at(-1)![0].length),
    words: parts.map((part) => normalize(part[0])),
  };
  const candidates = index.get(key) ?? [];
  candidates.push(entry);
  index.set(key, candidates);
  for (let i = 1; i <= key.length; i++) prefixes.add(key.slice(0, i));
  maxKeyLength = Math.max(maxKeyLength, key.length);
  maxWindow = Math.max(maxWindow, boundaries.size + 1);
  if (/^[a-z]{5,32}$/.test(key) && parts.length <= 3 && entry.words.some((word) => word.length >= 5)) {
    for (let i = -1; i < key.length; i++) {
      const deletion = i < 0 ? key : key.slice(0, i) + key.slice(i + 1);
      const values = deletionIndex.get(deletion) ?? new Set<Entry>();
      values.add(entry);
      deletionIndex.set(deletion, values);
    }
  }
  for (const make of row.makes) makeIndex.set(compact(make), make);
}
for (const [alias, make] of Object.entries(makeAliases)) makeIndex.set(alias, make);
// Source-equivalent spellings share vetted split positions (SuperCab / Super Cab).
for (const entries of index.values())
  for (const entry of entries)
    for (const other of entries) {
      for (const position of other.boundaries) entry.boundaries.add(position);
    }
// Reviewed spelling exception: this common spelling is two edits from Corolla.
// It is deliberately independent of the generic single-edit fuzzy policy.
for (const entry of index.get('corolla')!) {
  index.set('corrola', [{ ...entry, key: 'corrola', family: true, boundaries: new Set(), punctuation: new Map() }]);
}
for (let size = 1; size <= 'corrola'.length; size++) prefixes.add('corrola'.slice(0, size));

function tokenize(text: string): Token[] {
  const tokens: Token[] = [...text.matchAll(words)].map((match) => ({
    value: normalize(match[0]),
    start: match.index!,
    end: match.index! + match[0].length,
  }));
  const ignored: { start: number; end: number }[] = [];
  let tokenCursor = 0;
  for (const chunk of text.matchAll(/\S+/gu)) {
    const raw = chunk[0].normalize('NFKC');
    const dotted = raw.includes('.') ? index.get(compact(raw.replace(/^[\[(<]+|[\])>.,]+$/g, ''))) : undefined;
    let qualifiedDottedModel = false;
    if (dotted) {
      while (tokenCursor < tokens.length && tokens[tokenCursor].end <= chunk.index!) tokenCursor++;
      let end = tokenCursor;
      while (end + 1 < tokens.length && tokens[end + 1].start < chunk.index! + chunk[0].length) end++;
      const matchedSurface = surface(text.slice(tokens[tokenCursor].start, tokens[end].end));
      const makes = nearbyMake(tokens, tokenCursor, end, text);
      qualifiedDottedModel = dotted.some(
        (entry) => entry.surface === matchedSurface && makes.some((mention) => entry.makes.includes(mention.make)),
      );
    }
    // Anchored domain test and simple delimiters avoid backtracking across a long input.
    if (
      raw.includes('@') ||
      raw.includes('://') ||
      /^(?:[\[(<]*)(?:www\.|mailto:)/i.test(raw) ||
      (!qualifiedDottedModel && /^[\[(<]*[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/:?#\])>.,]|$)/i.test(raw))
    ) {
      ignored.push({ start: chunk.index!, end: chunk.index! + chunk[0].length });
    }
  }
  if (!ignored.length) return tokens;
  let blocked = 0;
  return tokens.filter((token) => {
    while (blocked < ignored.length && ignored[blocked].end <= token.start) blocked++;
    return blocked >= ignored.length || ignored[blocked].start > token.start;
  });
}

const ordinaryGap = /^[\s\p{Pd}]+$/u;
const modelGap = /^[\s\p{Pd}().&/]+$/u;
const makeGap = /^[\s\p{Pd}:'’]+$/u;

function compatibleFormatting(entry: Entry, tokens: Token[], from: number, to: number, text: string): boolean {
  let length = 0;
  for (let i = from; i < to; i++) {
    length += tokens[i].value.length;
    if (!entry.boundaries.has(length)) return false;
    const gap = text.slice(tokens[i].end, tokens[i + 1].start).normalize('NFKC');
    if (!ordinaryGap.test(gap)) {
      const original = entry.punctuation.get(length) ?? '';
      if ([...gap.replace(/\s|\p{Pd}/gu, '')].some((character) => !original.includes(character))) return false;
    }
  }
  return true;
}

function nearbyMake(tokens: Token[], from: number, to: number, text: string): MakeMention[] {
  const result: MakeMention[] = [];
  // Make immediately before/after the model, with an optional intervening model year.
  for (const direction of [-1, 1]) {
    let edge = direction < 0 ? from - 1 : to + 1;
    const modelEdge = direction < 0 ? tokens[from].start : tokens[to].end;
    for (let step = 0; step < 2; step++) {
      if (tokens[edge] && /^(?:19|20)\d{2}$/.test(tokens[edge].value)) edge += direction;
      else if (
        direction < 0 &&
        tokens[edge]?.value === 'model' &&
        /^\s*:\s*$/.test(text.slice(tokens[edge].end, tokens[from].start).normalize('NFKC'))
      )
        edge--;
    }
    for (let size = 1; size <= 3; size++) {
      const begin = direction < 0 ? edge - size + 1 : edge;
      const end = direction < 0 ? edge : edge + size - 1;
      if (begin < 0 || end >= tokens.length) break;
      if (Math.abs((direction < 0 ? tokens[begin].start : tokens[end].end) - modelEdge) > 64) break;
      const gap = normalize(
        direction < 0
          ? text.slice(tokens[end].end, tokens[from].start)
          : text.slice(tokens[to].end, tokens[begin].start),
      );
      const stripped = gap.replace(/\b(?:19|20)\d{2}\b/g, '').replace(/\bmodel\s*:/g, '');
      const parenthesized =
        direction > 0 &&
        /^\s*\(\s*$/.test(stripped) &&
        /^\s*\)/.test(text.slice(tokens[end].end, tokens[end].end + 4).normalize('NFKC'));
      if (!(direction < 0 ? makeGap.test(stripped) : ordinaryGap.test(stripped) || parenthesized)) continue;
      const raw = text.slice(tokens[begin].start, tokens[end].end);
      if (/[^\p{L}\p{M}\p{N}\s\p{Pd}]/u.test(raw)) continue;
      const make = makeIndex.get(compact(raw));
      if (make) result.push({ from: begin, to: end, make });
    }
  }
  return result;
}

const serviceWords =
  /\b(?:ppf|tint|tinted|film|coat|coated|coating|ceramic|paint|paintwork|polish|polished|correction|protect|protected|protection|detail|detailed|clean|cleaned|cleaning|wash|washed|wax|shampoo|headlights|windshield|bumper|hood|roof|wheels|tires|tyres|tailgate|truck|sedan|suv|car|vehicle|carpets|seats|window|windows|leather|interior|interiors|garage|mirrors|passenger|brakes|dog hair)\b/;
const ordinarySuffix =
  /^(?:\s+)(?:of\b|on\b|app\b|display\b|filter\b|trapped\b|clubs?\b|ball\b|paper\b|report\b|is\s+on\b)/;

function localContext(tokens: Token[], from: number, to: number, text: string, key: string, fuzzy: boolean): boolean {
  const start = tokens[from].start;
  const end = tokens[to].end;
  const before = normalize(text.slice(Math.max(0, start - 100), start))
    .split(/[.!?;\n]/)
    .at(-1)!;
  const after = normalize(text.slice(end, end + 120)).split(/[.!?;\n]/)[0];
  if (ordinarySuffix.test(after) && commonModels.has(key)) return false;
  if (key === 'focus' && /^\s+is\b/.test(after)) return false;
  const owned =
    /\b(?:my|our|your|his|her|their)(?:\s+(?:new|old|used|\d{4})){0,2}\s*$/.test(before) ||
    /\b(?:own|drive|driving|bought|buying|sold|selling|leased|bring|brought|picked up)(?:\s+(?:a|an|the|my|our|new|used|\d{4})){0,3}\s*$/.test(
      before,
    );
  if (fuzzy && owned) return true;
  if (owned && !highRiskCommonModels.has(key)) return true;
  if (
    !highRiskCommonModels.has(key) &&
    /\b(?:have|own|drive|bought|sold|leased)\b/.test(before) &&
    /\b(?:and|or)\s+(?:a|an|the|my|our)\s*$/.test(before)
  )
    return true;
  if (/^\s+(?:truck|sedan|suv|car|vehicle|hatchback|convertible)\b/.test(after)) return true;
  const service = serviceWords.test(before + ' ' + after);
  if (
    owned &&
    service &&
    (/^\s+(?:has|needs?|is|gets?|with|for|in|be|can|could|would|will|and)\b/.test(after) ||
      /\b(?:quote|tint|clean|coat|polish|wash|detail|film|ppf)\b/.test(before))
  )
    return true;
  if (/\b(?:own|drive|driving|bought|buying|sold|selling|leased|picked up)\b/.test(before) && owned) return true;
  if (service && /\b(?:on|for|from|in|of)(?:\s+(?:a|an|the|my|our|new|used|\d{4})){0,3}\s*$/.test(before)) return true;
  return service && /\b(?:the|our|my)\s*$/.test(before) && /^\s+(?:has|needs?|is|barely)\b/.test(after);
}

function allowed(
  entry: Entry,
  tokens: Token[],
  from: number,
  to: number,
  text: string,
  makes: MakeMention[],
  fuzzy: boolean,
): boolean {
  if (makes.some((mention) => entry.makes.includes(mention.make))) return true;
  if (/^\d+$/.test(entry.key)) return false;
  if (makes.length) return true;
  const short =
    entry.key.length <= 2 || (/^[a-z]{3}$/.test(entry.key) && !['crv', 'hrv', 'crz', 'chr'].includes(entry.key));
  if (fuzzy || short || commonModels.has(entry.key)) return localContext(tokens, from, to, text, entry.key, fuzzy);
  return true;
}

function groupFor(
  entries: Iterable<Entry>,
  tokens: Token[],
  from: number,
  to: number,
  text: string,
  fuzzy: boolean,
): Group | undefined {
  const makes = nearbyMake(tokens, from, to, text);
  let candidates = [...entries].filter(
    (entry) =>
      (fuzzy || compatibleFormatting(entry, tokens, from, to, text)) &&
      allowed(entry, tokens, from, to, text, makes, fuzzy),
  );
  const compatible = makes.filter((mention) => candidates.some((entry) => entry.makes.includes(mention.make)));
  const leading = compatible.filter((mention) => mention.to < from);
  const validMakes = leading.length ? leading : compatible;
  if (validMakes.length)
    candidates = candidates.filter((entry) => validMakes.some((mention) => entry.makes.includes(mention.make)));
  const matches = candidates
    .map((entry): VehicleMatch => {
      const start = tokens[from].start;
      let end = tokens[to].end;
      if (entry.suffix && text.slice(end, end + entry.suffix.length).normalize('NFKC') === entry.suffix)
        end += entry.suffix.length;
      const matchedText = text.slice(start, end);
      return {
        model: entry.model,
        makes: entry.makes
          .filter((make) => !validMakes.length || validMakes.some((mention) => mention.make === make))
          .slice()
          .sort(),
        matchedText,
        start,
        end,
        matchType: fuzzy ? 'fuzzy' : entry.family || surface(matchedText) !== entry.surface ? 'alias' : 'exact',
      };
    })
    .sort((a, b) => compare(a.model, b.model));
  if (!matches.length) return undefined;
  return {
    from,
    to,
    matches,
    qualified: validMakes.length > 0,
    usedMake: validMakes.flatMap((mention) =>
      Array.from({ length: mention.to - mention.from + 1 }, (_, offset) => mention.from + offset),
    ),
  };
}

function singleWordEdit(entry: Entry, tokens: Token[], from: number, to: number): boolean {
  if (entry.words.length !== to - from + 1) return false;
  let changed = false;
  for (let i = 0; i < entry.words.length; i++) {
    const expected = entry.words[i];
    const actual = tokens[from + i].value;
    if (expected === actual) continue;
    // Preserve every short code component, even in alphabetic composites such as A-Class.
    if (changed || expected.length < 5 || actual.length < 5 || damerau(expected, actual) !== 1) return false;
    changed = true;
  }
  return changed;
}

/**
 * Finds vehicle-model mentions in arbitrary text.
 *
 * Uses the detailed output shape by default. Pass `{ output: 'compact' }` when
 * only canonical make/model pairs are needed.
 */
export function findVehicles<TOutput extends VehicleOutput = 'detailed'>(
  text: string,
  options?: FindOptions<TOutput>,
): FindVehiclesResult<TOutput>;
export function findVehicles(
  text: string,
  options?: FindOptions<VehicleOutput>,
): VehicleMatch[] | CompactVehicleMatch[] {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  validateOptions(options);
  const tokens = tokenize(text);
  const exact: Group[] = [];
  const occupied = new Uint8Array(tokens.length);
  const makeTokens = new Set<number>();
  for (let from = 0; from < tokens.length; from++) {
    let key = '';
    let best: Group | undefined;
    for (let to = from; to < tokens.length && to < from + maxWindow; to++) {
      if (to > from && !modelGap.test(text.slice(tokens[to - 1].end, tokens[to].start).normalize('NFKC'))) break;
      key += tokens[to].value;
      if (key.length > maxKeyLength || !prefixes.has(key)) break;
      const entries = index.get(key);
      if (entries) {
        const group = groupFor(entries, tokens, from, to, text, false);
        if (group) best = group;
      }
    }
    if (best) {
      exact.push(best);
      for (const index of best.usedMake) makeTokens.add(index);
    }
  }
  const groups: Group[] = [];
  for (const group of exact) {
    if (occupied[group.from] || (!group.qualified && makeTokens.has(group.from))) continue;
    groups.push(group);
    occupied.fill(1, group.from, group.to + 1);
  }
  if (options?.fuzzy !== false) {
    for (let from = 0; from < tokens.length; from++) {
      if (occupied[from] || makeTokens.has(from) || fuzzyStopWords.has(tokens[from].value)) continue;
      let key = '';
      let best: Group | undefined;
      for (let to = from; to < tokens.length && to < from + 3; to++) {
        if (occupied[to] || makeTokens.has(to) || !/^[a-z]+$/.test(tokens[to].value)) break;
        if (to > from && !ordinaryGap.test(text.slice(tokens[to - 1].end, tokens[to].start))) break;
        key += tokens[to].value;
        if (key.length > 32) break;
        if (key.length < 5 || index.has(key)) continue;
        const candidates = new Set<Entry>();
        for (let i = -1; i < key.length; i++) {
          const deletion = i < 0 ? key : key.slice(0, i) + key.slice(i + 1);
          for (const entry of deletionIndex.get(deletion) ?? []) {
            if (singleWordEdit(entry, tokens, from, to)) candidates.add(entry);
          }
        }
        const group = candidates.size ? groupFor(candidates, tokens, from, to, text, true) : undefined;
        if (group) best = group;
      }
      if (best) {
        groups.push(best);
        occupied.fill(1, best.from, best.to + 1);
        from = best.to;
      }
    }
  }
  const matches = groups.sort((a, b) => a.from - b.from).flatMap((group) => group.matches);
  if (options?.output === 'compact') {
    return matches.flatMap(({ model, makes }) => makes.map((make) => ({ make, model })));
  }
  return matches;
}

/** Sorted unique possible makes from detected model mentions. */
export function findMakes(text: string, options?: Pick<FindOptions, 'fuzzy'>): string[] {
  validateOptions(options);
  return [...new Set(findVehicles(text, { ...options, output: 'detailed' }).flatMap((match) => match.makes))].sort();
}
