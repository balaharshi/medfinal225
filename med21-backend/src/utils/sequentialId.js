import { db } from '../db/index.js';

export const nextSequentialId = async (table, prefix = 'id') => {
  const rows = await db.select({ id: table.id }).from(table);
  const numericIds = rows
    .map(({ id }) => Number(id))
    .filter((value) => Number.isInteger(value) && value > 0);

  const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : rows.length + 1;
  return `${prefix}-${Date.now()}-${nextId}`;
};
