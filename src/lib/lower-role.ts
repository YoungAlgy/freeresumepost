// Lowercases a role/specialty display name for mid-sentence copy, without
// mangling acronym credentials (CRNA, LPN, MRI, BCBA) into lowercase
// gibberish. A plain .toLowerCase() on "CRNA" or "MRI Technologist" reads
// like a typo to the credential-proud audience these pages target.
//
// Rule: a word stays as-is if its letters (ignoring surrounding punctuation
// like parens or slashes) are 2+ characters and fully uppercase, or if it
// contains a digit. Every other word gets lowercased normally.
export function lowerRole(name: string): string {
  return name
    .split(' ')
    .map((word) => {
      const letters = word.replace(/[^a-zA-Z]/g, '')
      const isAcronym = letters.length >= 2 && letters === letters.toUpperCase()
      const hasDigit = /\d/.test(word)
      return isAcronym || hasDigit ? word : word.toLowerCase()
    })
    .join(' ')
}
