import { SurveyAnswer } from '../types/game';

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

export interface MatchResult {
  matchedAnswer: SurveyAnswer | null;
  matchedKeyword?: string;
  confidence: number; // 0 to 1
  isAlreadyRevealed: boolean;
}

export function matchUserAnswer(
  rawInput: string,
  answers: SurveyAnswer[],
  revealedAnswerIds: number[]
): MatchResult {
  const input = normalizeText(rawInput);
  if (!input || input.length < 2) {
    return { matchedAnswer: null, confidence: 0, isAlreadyRevealed: false };
  }

  let bestMatch: SurveyAnswer | null = null;
  let bestKeyword: string = '';
  let highestScore = 0;

  for (const answer of answers) {
    const mainAnswerNorm = normalizeText(answer.text);

    // Exact match with main text
    if (mainAnswerNorm === input) {
      const isRevealed = revealedAnswerIds.includes(answer.id);
      return { matchedAnswer: answer, matchedKeyword: answer.text, confidence: 1.0, isAlreadyRevealed: isRevealed };
    }

    // Substring match with main text
    if (
      (input.length >= 4 && mainAnswerNorm.includes(input)) ||
      (mainAnswerNorm.length >= 4 && input.includes(mainAnswerNorm))
    ) {
      if (highestScore < 0.95) {
        highestScore = 0.95;
        bestMatch = answer;
        bestKeyword = answer.text;
      }
    }

    // Check all configured keywords
    for (const kw of answer.keywords) {
      const kwNorm = normalizeText(kw);

      if (kwNorm === input) {
        highestScore = 1.0;
        bestMatch = answer;
        bestKeyword = kw;
        break;
      }

      // Substring check for keywords
      if (
        (input.length >= 3 && kwNorm.includes(input)) ||
        (kwNorm.length >= 3 && input.includes(kwNorm))
      ) {
        const score = 0.88;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = answer;
          bestKeyword = kw;
        }
      }

      // Levenshtein fuzzy distance tolerance
      const maxLen = Math.max(input.length, kwNorm.length);
      if (maxLen >= 4) {
        const dist = levenshteinDistance(input, kwNorm);
        const threshold = maxLen > 7 ? 2 : 1;
        if (dist <= threshold) {
          const simScore = 1 - dist / maxLen;
          if (simScore > highestScore) {
            highestScore = simScore;
            bestMatch = answer;
            bestKeyword = kw;
          }
        }
      }
    }
  }

  if (bestMatch && highestScore >= 0.75) {
    const isRevealed = revealedAnswerIds.includes(bestMatch.id);
    return {
      matchedAnswer: bestMatch,
      matchedKeyword: bestKeyword,
      confidence: highestScore,
      isAlreadyRevealed: isRevealed,
    };
  }

  return { matchedAnswer: null, confidence: 0, isAlreadyRevealed: false };
}
