const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (left: string, right: string) => {
  const a = normalize(left);
  const b = normalize(right);
  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);

  for (let column = 1; column <= b.length; column += 1) matrix[0][column] = column;

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const tokenScore = (query: string, candidate: string) => {
  const queryTokens = new Set(normalize(query).split(" ").filter(Boolean));
  const candidateTokens = new Set(normalize(candidate).split(" ").filter(Boolean));
  if (!queryTokens.size || !candidateTokens.size) return 0;

  let overlap = 0;
  queryTokens.forEach((token) => {
    if (candidateTokens.has(token)) overlap += 1;
  });

  return overlap / Math.max(queryTokens.size, candidateTokens.size);
};

export const FuzzySearchEngine = {
  normalize,

  score: (query: string, candidate: string) => {
    const normalizedQuery = normalize(query);
    const normalizedCandidate = normalize(candidate);
    if (!normalizedQuery || !normalizedCandidate) return 0;
    if (normalizedQuery === normalizedCandidate) return 1;
    if (normalizedCandidate.includes(normalizedQuery)) {
      // Query is a substring of candidate — score based on how much of the candidate the query covers
      const ratio = normalizedQuery.length / normalizedCandidate.length;
      return 0.72 + ratio * 0.22; // 0.72–0.94 range
    }
    if (normalizedQuery.includes(normalizedCandidate)) {
      // Candidate is a substring of query — penalize short candidates matching long queries
      const ratio = normalizedCandidate.length / normalizedQuery.length;
      return 0.52 + ratio * 0.30; // 0.52–0.82 range
    }

    const distance = levenshtein(normalizedQuery, normalizedCandidate);
    const maxLength = Math.max(normalizedQuery.length, normalizedCandidate.length);
    const editScore = maxLength ? 1 - distance / maxLength : 0;

    return Math.max(editScore, tokenScore(query, candidate));
  },
};
