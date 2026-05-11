# Component Reference Guide

## Button Component

```jsx
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

// Basic buttons
<Button variant="primary">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Approve</Button>

// With icons
<Button icon={Plus}>Create</Button>
<Button icon={Trash2} iconPosition="right">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button> {/* default */}
<Button size="lg">Large</Button>

// States
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>

// Full width
<Button fullWidth>Full Width</Button>

// Custom styling
<Button className="rounded-full">Custom</Button>
```

---

## Input Components

### Input
```jsx
import { Input } from '@/components/ui/Input';

// Basic
<Input placeholder="Enter text" />

// With label
<Input
  label="Item Name"
  placeholder="Enter item name"
  required
/>

// With validation
<Input
  label="Email"
  type="email"
  error="Invalid email"
/>

// Success state
<Input
  label="Password"
  type="password"
  success
  helpText="Password is strong"
/>

// With help text
<Input
  label="Description"
  helpText="Maximum 200 characters"
  maxLength={200}
/>

// With prefix/suffix
<Input prefix="$" placeholder="Price" />
<Input suffix="@example.com" placeholder="Username" />

// Disabled
<Input disabled placeholder="Can't edit this" />
```

### Textarea
```jsx
import { Textarea } from '@/components/ui/Input';

<Textarea
  label="Description"
  placeholder="Enter description"
  rows={4}
  error={error}
  helpText="Be descriptive"
/>
```

### Select
```jsx
import { Select } from '@/components/ui/Input';

<Select
  label="Category"
  options={[
    { value: 'phone', label: 'Phone' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'keys', label: 'Keys' },
  ]}
  onChange={handleChange}
/>
```

### Checkbox
```jsx
import { Checkbox } from '@/components/ui/Input';

<Checkbox
  label="I agree to terms"
  onChange={handleChange}
/>
```

---

## Badge Component

```jsx
import { Badge, ScoreBadge } from '@/components/ui/Badge';

// Status badges (auto-icons and colors)
<Badge status="Claimed" />
<Badge status="Pending" />
<Badge status="Active" />
<Badge status="Error" />
<Badge status="Unclaimed" />

// Without icon
<Badge status="Active" showIcon={false} />

// Score badges
<ScoreBadge score={95} /> {/* Green */}
<ScoreBadge score={75} /> {/* Orange */}
<ScoreBadge score={45} /> {/* Red */}

// Custom styling
<Badge status="Active" className="text-lg" />
```

---

## Loading & Skeleton Components

```jsx
import { LoadingSpinner, SkeletonLoader, TableSkeleton } from '@/components/ui/LoadingSpinner';

// Spinner
<LoadingSpinner message="Loading items..." />
<LoadingSpinner size="sm" message="Please wait..." />
<LoadingSpinner size="lg" />

// Skeleton loaders
<SkeletonLoader rows={3} />
<SkeletonLoader rows={5} showHeader />
<TableSkeleton rows={10} columns={5} />
```

---

## Empty State Component

```jsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Package } from 'lucide-react';

<EmptyState
  icon={Package}
  title="No items found"
  description="Create your first item to get started"
  actionLabel="Create Item"
  onAction={handleCreate}
  actionIcon={Plus}
/>

// Preset empty states
<EmptyState {...emptyStates.noItems} />
<EmptyState {...emptyStates.noReports} />
<EmptyState {...emptyStates.noMatches} />
```

---

## Alert Component

```jsx
import { Alert, AlertGroup, Toast } from '@/components/ui/Alert';

// Single alert
<Alert
  type="success"
  title="Success!"
  message="Item created successfully"
  dismissible
/>

// Error alert
<Alert
  type="error"
  title="Error"
  message="Failed to create item"
/>

// Warning
<Alert
  type="warning"
  title="Warning"
  message="This action cannot be undone"
/>

// Info
<Alert
  type="info"
  message="New items are available"
/>

// Alert group
<AlertGroup alerts={[
  { type: 'success', message: 'Item created' },
  { type: 'error', message: 'Save failed' },
]} />

// Toast notification
<Toast
  type="success"
  message="Item saved successfully"
  duration={3000}
/>
```

---

## Card Components

```jsx
import { Card, CardHeader, CardContent, CardFooter, StatCard, GridCard } from '@/components/ui/Card';
import { Package, Plus } from 'lucide-react';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>

// Card with structure
<Card>
  <CardHeader
    title="Items"
    subtitle="Manage your items"
    action={<Button icon={Plus}>Add</Button>}
  />
  <CardContent>
    {/* content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>

// Elevated card
<Card elevated>
  <h3>Important</h3>
</Card>

// Interactive card
<Card interactive onClick={handleClick}>
  <h3>Click me</h3>
</Card>

// Stat card
<StatCard
  icon={Package}
  label="Total Items"
  value={42}
  change="↑ 12%"
  trend="up"
  onClick={handleClick}
/>

// Grid card
<GridCard
  icon={Package}
  title="Unclaimed Items"
  description="12 items awaiting claim"
  action={<Button>View All</Button>}
/>
```

---

## Data Table

```jsx
import { DataTable, DataList } from '@/components/ui/DataTable';

// Basic table
<DataTable
  columns={[
    { key: 'id', label: '#' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ]}
  data={items}
  loading={loading}
  rowKey="id"
/>

// With custom rendering
<DataTable
  columns={[
    { key: 'name', label: 'Item' },
    { key: 'status', label: 'Status' },
  ]}
  data={items}
  renderRow={(item) => (
    <>
      <td>{item.name}</td>
      <td><Badge status={item.status} /></td>
      <td>
        <Button variant="ghost" size="sm">View</Button>
      </td>
    </>
  )}
/>

// With row click
<DataTable
  columns={columns}
  data={items}
  onRowClick={(row) => navigate(`/items/${row.id}`)}
/>

// With sorting
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
  ]}
  data={items}
  sortable
  sortColumn={sortCol}
  sortDirection={sortDir}
  onSort={(col, dir) => handleSort(col, dir)}
/>

// Data list (mobile-friendly)
<DataList
  data={items}
  renderItem={(item) => (
    <div>
      <h4>{item.name}</h4>
      <p>{item.description}</p>
    </div>
  )}
  emptyMessage="No items found"
/>
```

---

## Navigation

```jsx
import { ModernNavigation } from '@/components/ui/ModernNav';

<ModernNavigation
  navItems={[
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/items', icon: Package, label: 'Items' },
    { to: '/reports', icon: FileText, label: 'Reports' },
  ]}
  user={{
    first_name: 'John',
    last_name: 'Doe',
    role: 'Admin',
  }}
  onLogout={handleLogout}
  onSettings={handleSettings}
/>
```

---

## Search & Filter

```jsx
import { SearchBar, FilterBar, FilterChips } from '@/components/ui/SearchBar';

// Search bar
<SearchBar
  value={search}
  onChange={setSearch}
  onClear={handleClear}
  placeholder="Search items..."
/>

// Filter bar
<FilterBar
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'closed', label: 'Closed' },
      ],
    },
    {
      key: 'date',
      label: 'Date',
      type: 'date',
    },
  ]}
  values={filters}
  onChange={(key, val) => setFilter(key, val)}
  onReset={clearFilters}
/>

// Filter chips
<FilterChips
  filters={[
    { id: 'status-active', label: 'Status: Active' },
    { id: 'date-2024', label: 'Date: 2024' },
  ]}
  onRemove={(id) => removeFilter(id)}
/>
```

---

## Page Header

```jsx
import { PageHeader } from '@/components/ui/PageHeader';
import { FileText, Plus } from 'lucide-react';

<PageHeader
  breadcrumbs={['Home', 'Items', 'Details']}
  icon={FileText}
  title="Lost Reports"
  subtitle="Manage and track lost items"
  action={
    <Button icon={Plus}>
      New Report
    </Button>
  }
/>
```

---

## Complete Page Example

```jsx
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Plus, Eye } from 'lucide-react';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch items
    setLoading(false);
  }, []);

  const handleCreate = () => {
    // Create item
  };

  return (
    <div className="p-lg max-w-7xl mx-auto">
      {/* Errors */}
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-lg"
        />
      )}

      {/* Header */}
      <PageHeader
        title="Items"
        subtitle="Browse and manage items"
        action={
          <Button
            icon={Plus}
            onClick={handleCreate}
          >
            New Item
          </Button>
        }
      />

      {/* Search */}
      <div className="card mb-lg">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search items..."
        />
      </div>

      {/* Table */}
      <div className="card p-0">
        <DataTable
          columns={[
            { key: 'id', label: '#' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status' },
          ]}
          data={items}
          loading={loading}
          rowKey="id"
          renderRow={(item) => (
            <>
              <td className="px-lg py-md">{item.id}</td>
              <td className="px-lg py-md font-medium">{item.name}</td>
              <td className="px-lg py-md">{item.category}</td>
              <td className="px-lg py-md">
                <Badge status={item.status} />
              </td>
              <td className="px-lg py-md text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  View
                </Button>
              </td>
            </>
          )}
        />
      </div>
    </div>
  );
}
```

---

## Design Token Usage

```jsx
import { Colors, Typography, Spacing, Shadows } from '@/lib/DesignTokens';

// Using tokens in custom components
<div style={{
  backgroundColor: Colors.bg.secondary,
  color: Colors.text.primary,
  padding: Spacing.lg,
  borderRadius: '8px',
  boxShadow: Shadows.md,
  fontFamily: Typography.fontFamily.body,
}}>
  Content
</div>

// Or with Tailwind
<div className="bg-slate-50 text-slate-900 p-lg rounded-lg shadow-md">
  Content
</div>
```

---

## Accessibility Features

All components include:
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ Color contrast compliance (WCAG AA)
- ✅ Screen reader support
- ✅ Touch-friendly targets (44x44px minimum)

---

## Tips & Best Practices

1. **Always use semantic HTML** - Use `<button>` for buttons, not `<div>`
2. **Provide labels** - Use labels for form inputs
3. **Show loading states** - Use `loading` prop or `LoadingSpinner`
4. **Handle errors gracefully** - Use `Alert` component
5. **Show empty states** - Use `EmptyState` component
6. **Use proper spacing** - Stick to spacing scale
7. **Test accessibility** - Use keyboard navigation
8. **Mobile-first** - Design for mobile, enhance for desktop
