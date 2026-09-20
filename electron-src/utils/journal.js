const { generateDocumentNumber } = require('./numbering');

/**
 * Resolve a chart-of-accounts id by code, with a graceful fallback to the
 * first account matching (account_type + name pattern). Returns null when no
 * account can be found so callers can decide how to handle a missing account.
 */
function resolveAccount(db, code, fallbackType, fallbackPattern) {
  const byCode = db.prepare('SELECT id FROM chart_of_accounts WHERE code = ? AND is_deleted = 0').get(code);
  if (byCode) return byCode.id;
  if (fallbackType && fallbackPattern) {
    const byName = db.prepare('SELECT id FROM chart_of_accounts WHERE account_type = ? AND name LIKE ? AND is_deleted = 0 ORDER BY id').get(fallbackType, `%${fallbackPattern}%`);
    if (byName) return byName.id;
  }
  return null;
}

/**
 * Create a balanced journal entry together with its lines.
 *
 * lines: [{ account_id, debit, credit }] (amounts are numbers)
 *
 * The entry is only written when every line resolves to an account AND the
 * totals balance (within a small float tolerance). When the entry cannot be
 * created (missing accounts / unbalanced lines) the function returns null
 * instead of throwing, so the calling business transaction is not aborted.
 */
function createJournalEntry(db, { branch_id = 1, description, reference_type, reference_id, lines, created_by }) {
  const normalized = (lines || [])
    .filter((line) => line.account_id)
    .map((line) => ({
      account_id: line.account_id,
      debit: Math.max(0, Number(line.debit || 0)),
      credit: Math.max(0, Number(line.credit || 0)),
    }));

  if (!normalized.length) return null;

  const totalDebit = normalized.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = normalized.reduce((sum, line) => sum + line.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) return null;

  const entryNumber = generateDocumentNumber('journal_entries', 'entry_number', 'JE-');
  const entry = db
    .prepare("INSERT INTO journal_entries (branch_id, entry_number, date, description, reference_type, reference_id, is_posted, created_by) VALUES (?, ?, date('now'), ?, ?, ?, 1, ?)")
    .run(branch_id, entryNumber, description || null, reference_type || null, reference_id || null, created_by || null);

  const insertLine = db.prepare('INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)');
  for (const line of normalized) {
    insertLine.run(entry.lastInsertRowid, line.account_id, line.debit, line.credit);
  }

  return { id: entry.lastInsertRowid, entry_number: entryNumber, total_debit: totalDebit, total_credit: totalCredit };
}

module.exports = { resolveAccount, createJournalEntry };
