const { recommendStorageType, pickSection, SAFE_CATEGORIES } = require('../../modules/storage/recommend');

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
