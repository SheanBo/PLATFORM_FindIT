const { recommendStorageType, pickSection, pickSectionForCategory, OTHERS_BIN_NAME, SAFE_CATEGORIES } = require('../../modules/storage/recommend');

describe('recommendStorageType', () => {
  test.each([...SAFE_CATEGORIES])('%s goes to the office safe', (name) => {
    expect(recommendStorageType(name)).toBe('Office_Safe');
  });

  test.each(['Keys', 'Umbrella', 'Bag', 'Clothing', 'Eyewear', 'Water_Bottle', 'Food_Container', 'Other'])(
    '%s goes to a locker', (name) => {
      expect(recommendStorageType(name)).toBe('Locker');
    }
  );

  test('unknown category defaults to locker', () => {
    expect(recommendStorageType('Something_New')).toBe('Locker');
  });
});

describe('pickSection', () => {
  const sections = [
    { Section_ID: 1, Storage_Type: 'Locker', Section_Name: 'Locker A', Capacity: 20, Actual_Load: 18 },
    { Section_ID: 2, Storage_Type: 'Locker', Section_Name: 'Locker B', Capacity: 20, Actual_Load: 5 },
    { Section_ID: 3, Storage_Type: 'Office_Safe', Section_Name: 'Safe A', Capacity: 10, Actual_Load: 10 },
    { Section_ID: 4, Storage_Type: 'Office_Safe', Section_Name: 'Safe B', Capacity: 10, Actual_Load: 9 },
  ];

  test('picks the section of the right type with the most free space', () => {
    expect(pickSection(sections, 'Locker').Section_ID).toBe(2);
  });

  test('skips sections at capacity', () => {
    expect(pickSection(sections, 'Office_Safe').Section_ID).toBe(4);
  });

  test('returns null when every section of the type is full', () => {
    const full = sections.map(s => ({ ...s, Actual_Load: s.Capacity }));
    expect(pickSection(full, 'Locker')).toBeNull();
  });

  test('returns null when no section of the type exists', () => {
    expect(pickSection([], 'Locker')).toBeNull();
  });

  test('falls back to Current_Load when Actual_Load is absent', () => {
    const rows = [
      { Section_ID: 7, Storage_Type: 'Locker', Capacity: 20, Current_Load: 20 },
      { Section_ID: 8, Storage_Type: 'Locker', Capacity: 20, Current_Load: 1 },
    ];
    expect(pickSection(rows, 'Locker').Section_ID).toBe(8);
  });
});

describe('pickSectionForCategory', () => {
  const sections = [
    { Section_ID: 1, Storage_Type: 'Locker', Section_Name: 'Locker A', Capacity: 20, Actual_Load: 5 },
    { Section_ID: 2, Storage_Type: 'Locker', Section_Name: OTHERS_BIN_NAME, Capacity: 20, Actual_Load: 18 },
    { Section_ID: 3, Storage_Type: 'Office_Safe', Section_Name: 'Safe A', Capacity: 10, Actual_Load: 2 },
  ];

  test('Other category picks the Others Bin even when another locker has more free space', () => {
    const section = pickSectionForCategory(sections, 'Other', 'Locker');
    expect(section.Section_ID).toBe(2);
  });

  test('Other category falls back to the least-loaded locker when the Others Bin is full', () => {
    const full = sections.map(s => s.Section_Name === OTHERS_BIN_NAME ? { ...s, Actual_Load: s.Capacity } : s);
    const section = pickSectionForCategory(full, 'Other', 'Locker');
    expect(section.Section_ID).toBe(1);
  });

  test('Other category falls back to the least-loaded locker when the Others Bin is missing', () => {
    const withoutBin = sections.filter(s => s.Section_Name !== OTHERS_BIN_NAME);
    const section = pickSectionForCategory(withoutBin, 'Other', 'Locker');
    expect(section.Section_ID).toBe(1);
  });

  test('non-Other category ignores the Others Bin and behaves like pickSection', () => {
    const section = pickSectionForCategory(sections, 'Wallet', 'Office_Safe');
    expect(section.Section_ID).toBe(3);
  });

  test('returns null when no matching section exists at all', () => {
    expect(pickSectionForCategory([], 'Other', 'Locker')).toBeNull();
  });
});
