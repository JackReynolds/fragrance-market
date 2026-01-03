/**
 * Detects sale-related terms in text to identify potential selling behavior
 * in swap listings from non-premium users.
 */

// Terms that indicate selling intent (case-insensitive, word boundary matching)
const SALE_TERMS = [
  "for sale",
  "selling",
  "sell only",
  "sale only",
  "buy now",
  "dm to buy",
  "message to buy",
  "shipping cost",
  "shipping fee",
  "bank transfer",
  "wire transfer",
  "paypal",
  "revolut",
  "venmo",
  "cashapp",
  "cash app",
  "zelle",
  "payment",
  "pay me",
  "asking price",
  "best offer",
  "obo", // "or best offer"
  "make an offer",
];

// Standalone terms that need word boundaries to avoid false positives
// e.g., "sell" but not "bestselling"
const STANDALONE_TERMS = ["sell", "price", "buy"];

// Currency patterns: symbol followed by number (e.g., €50, $100, £25)
const CURRENCY_PATTERN = /[€$£]\s*\d+/g;

/**
 * Detects sale-related terms in the provided text fields.
 *
 * @param {string} description - The listing description
 * @param {string} swapPreferences - The swap preferences text
 * @returns {{ detected: boolean, matchedTerms: string[] }}
 */
export function detectSaleTerms(description = "", swapPreferences = "") {
  const combinedText = `${description} ${swapPreferences}`.toLowerCase();
  const matchedTerms = [];

  // Check phrase-based sale terms
  for (const term of SALE_TERMS) {
    if (combinedText.includes(term.toLowerCase())) {
      matchedTerms.push(term);
    }
  }

  // Check standalone terms with word boundaries
  for (const term of STANDALONE_TERMS) {
    // Use word boundary regex to avoid partial matches
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(combinedText)) {
      // Avoid duplicate if already matched in a phrase
      const alreadyMatched = matchedTerms.some(
        (matched) => matched.toLowerCase().includes(term.toLowerCase())
      );
      if (!alreadyMatched) {
        matchedTerms.push(term);
      }
    }
  }

  // Check for currency symbols followed by numbers
  const currencyMatches = combinedText.match(CURRENCY_PATTERN);
  if (currencyMatches && currencyMatches.length > 0) {
    // Only flag if it looks like a price listing (not "I paid €50 for this")
    // Check for context clues that suggest asking for money
    const askingForMoney =
      /asking|want|looking for|accept|send|transfer/i.test(combinedText);
    const notPastTense = !/paid|bought|cost me|spent/i.test(combinedText);

    if (askingForMoney || notPastTense) {
      matchedTerms.push(`Currency amount (${currencyMatches[0]})`);
    }
  }

  // Deduplicate matched terms
  const uniqueTerms = [...new Set(matchedTerms)];

  return {
    detected: uniqueTerms.length > 0,
    matchedTerms: uniqueTerms,
  };
}

