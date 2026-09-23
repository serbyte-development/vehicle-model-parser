export interface ExpectedMention {
  model: string;
  makes: string[];
  matchedText: string;
  start: number;
  end: number;
}

export interface CorpusCase {
  id: string;
  category: string;
  provenance: 'hand-authored-synthetic' | 'user-provided-real-anonymized' | 'generated-source' | 'generated-synthetic';
  text: string;
  expected: ExpectedMention[];
  options?: { fuzzy?: boolean };
}
