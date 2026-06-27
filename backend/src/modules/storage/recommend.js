// Smart-storage recommendation shared by the /recommend endpoint.
// Valuables belong in the office safe; everything else goes to a locker.
const SAFE_CATEGORIES = new Set([
  'Wallet', 'Phone', 'Laptop', 'Tablet', 'Jewelry',
  'ID_Card', 'Documents', 'Electronics_Accessories'
]);

function recommendStorageType(categoryName) {
  return SAFE_CATEGORIES.has(categoryName) ? 'Office_Safe' : 'Locker';
}

function freeSpace(section) {
  const load = section.Actual_Load !== undefined ? section.Actual_Load : (section.Current_Load || 0);
  return section.Capacity - load;
}

// Pick the section of the given type with the most free space; null if all full.
function pickSection(sections, storageType) {
  return sections
    .filter(s => s.Storage_Type === storageType && freeSpace(s) > 0)
    .sort((a, b) => freeSpace(b) - freeSpace(a))[0] || null;
}

module.exports = { recommendStorageType, pickSection, SAFE_CATEGORIES };
