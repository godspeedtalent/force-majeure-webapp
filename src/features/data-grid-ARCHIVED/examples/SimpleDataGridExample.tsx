import { DataGrid, useDataGridConfig } from '../index';
import type { ColumnDef, RowAction } from '../index';

/**
 * Minimal example showing the new DataGrid in action
 * This can be imported and used in a page for testing
 */

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  category: string;
}

const sampleData: Product[] = [
  { id: '1', name: 'Laptop', price: 999, inStock: true, category: 'Electronics' },
  { id: '2', name: 'Mouse', price: 29, inStock: true, category: 'Electronics' },
  { id: '3', name: 'Keyboard', price: 79, inStock: false, category: 'Electronics' },
  { id: '4', name: 'Monitor', price: 299, inStock: true, category: 'Electronics' },
  { id: '5', name: 'Desk Chair', price: 199, inStock: true, category: 'Furniture' },
  { id: '6', name: 'Desk', price: 399, inStock: false, category: 'Furniture' },
  { id: '7', name: 'Lamp', price: 49, inStock: true, category: 'Furniture' },
  { id: '8', name: 'Notebook', price: 5, inStock: true, category: 'Stationery' },
  { id: '9', name: 'Pen Set', price: 15, inStock: true, category: 'Stationery' },
  { id: '10', name: 'Stapler', price: 12, inStock: false, category: 'Stationery' },
];

export function SimpleDataGridExample() {
  const columns: ColumnDef<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      editable: true,
      width: '250px'
    },
    {
      key: 'price',
      label: 'Price',
      type: 'number',
      sortable: true,
      editable: true,
      render: (value) => `$${value}`
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      filterable: true
    },
    {
      key: 'inStock',
      label: 'In Stock',
      type: 'boolean',
      sortable: true,
      editable: true
    }
  ];

  const rowActions: RowAction<Product>[] = [
    {
      label: 'View Details',
      onClick: (product) => alert(`Viewing ${product.name}`)
    },
    {
      label: 'Delete',
      onClick: (product) => {
        if (confirm(`Delete ${product.name}?`)) {
          alert(`Deleted ${product.name}`);
        }
      },
      variant: 'danger'
    }
  ];

  const config = useDataGridConfig<Product>({
    data: sampleData,
    columns,
    features: {
      sorting: {
        defaultSort: { column: 'name', direction: 'asc' }
      },
      filtering: {
        searchable: true,
        searchPlaceholder: 'Search products...'
      },
      pagination: {
        pageSize: 5,
        pageSizeOptions: [5, 10, 25]
      },
      selection: {
        enabled: true,
        mode: 'multiple'
      }
    },
    toolbar: {
      title: 'Products',
      search: true
    },
    rowActions,
    bulkActions: [
      {
        label: 'Export Selected',
        onClick: (products) => alert(`Exporting ${products.length} products`)
      }
    ],
    onUpdate: async (product, key, value) => {
      console.log('Update:', { product, key, value });
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    resourceName: 'Product'
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">New DataGrid System Demo</h1>
        <p className="text-muted-foreground">
          This demonstrates the new modular, type-safe data grid system.
          Try sorting, searching, selecting rows, and inline editing!
        </p>
      </div>
      <DataGrid config={config} />
    </div>
  );
}
