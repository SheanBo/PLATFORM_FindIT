const { translate, remapRow } = require('../../database/init');

describe('translate() — SQLite→Postgres dialect shim', () => {
  test('converts ? placeholders to $1,$2,...', () => {
    const { text } = translate('SELECT * FROM T WHERE A=? AND B=?');
    expect(text).toBe('SELECT * FROM T WHERE A=$1 AND B=$2');
  });

  test('does not renumber ? inside single-quoted string literals', () => {
    const { text } = translate("UPDATE T SET note='is it? yes' WHERE id=?");
    expect(text).toBe("UPDATE T SET note='is it? yes' WHERE id=$1");
  });

  test('rewrites INSERT OR IGNORE and flags it', () => {
    const { text, isIgnore } = translate('INSERT OR IGNORE INTO T (A) VALUES (?)');
    expect(text).toBe('INSERT INTO T (A) VALUES ($1)');
    expect(isIgnore).toBe(true);
  });

  test('leaves a plain INSERT unflagged', () => {
    const { isIgnore } = translate('INSERT INTO T (A) VALUES (?)');
    expect(isIgnore).toBe(false);
  });
});

describe('remapRow() — restore PascalCase result keys', () => {
  test('maps lowercased column names back to canonical casing', () => {
    const out = remapRow({ item_status: 'Unclaimed', role_type: 'Student' });
    expect(out).toEqual({ Item_Status: 'Unclaimed', Role_Type: 'Student' });
  });

  test('maps a known alias back to canonical casing', () => {
    const out = remapRow({ found_name: 'Wallet' });
    expect(out).toEqual({ Found_Name: 'Wallet' });
  });

  test('passes through null unchanged', () => {
    expect(remapRow(null)).toBeNull();
  });
});
