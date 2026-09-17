const { getDatabase } = require('../database/db');

function generateDocumentNumber(tableName, columnNumberName, prefix = 'DOC-') {
  const db = getDatabase();
  const year = new Date().getFullYear();
  const searchPattern = `${prefix}${year}-%`;

  const query = `
    SELECT ${columnNumberName} as docNumber 
    FROM ${tableName} 
    WHERE ${columnNumberName} LIKE ? 
    ORDER BY id DESC 
    LIMIT 1
  `;
  
  const lastRow = db.prepare(query).get(searchPattern);
  let nextSeq = 1;

  if (lastRow && lastRow.docNumber) {
    const parts = lastRow.docNumber.split('-');
    const lastSeqStr = parts[parts.length - 1];
    const lastSeqNum = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeqNum)) {
      nextSeq = lastSeqNum + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${prefix}${year}-${paddedSeq}`;
}

module.exports = {
  generateDocumentNumber,
};
