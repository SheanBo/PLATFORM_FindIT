// Smart-storage recommendation shared by the /recommend endpoint.
// Valuables belong in the office safe; everything else goes to a locker.
const SAFE_CATEGORIES = new Set([
  'Wallet', 'Phone', 'Laptop', 'Tablet', 'Jewelry',
  'ID_Card', 'Documents', 'Electronics_Accessories'
]);

const OTHERS_BIN_NAME = 'Others Bin';

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

// 'Other'-category items go to the dedicated Others Bin locker when it has
// room; otherwise fall back to the normal least-loaded-locker pick so the
// recommendation still resolves if the bin is missing or full.
function pickSectionForCategory(sections, categoryName, storageType) {
  if (categoryName === 'Other') {
    const bin = sections.find(s => s.Section_Name === OTHERS_BIN_NAME && s.Storage_Type === storageType && freeSpace(s) > 0);
    if (bin) return bin;
  }
  return pickSection(sections, storageType);
}

module.exports = { recommendStorageType, pickSection, pickSectionForCategory, OTHERS_BIN_NAME, SAFE_CATEGORIES };
