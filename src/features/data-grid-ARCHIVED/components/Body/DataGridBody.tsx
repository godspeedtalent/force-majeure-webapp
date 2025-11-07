import { TableBody } from '@/components/common/shadcn/table';
import { useDataGridContext } from '../../context/DataGridContext';
import { DataGridRow } from './DataGridRow';

/**
 * Table body component that renders all data rows
 */
export function DataGridBody() {
  const { data, creation } = useDataGridContext();

  return (
    <TableBody>
      {creation.isCreating && <DataGridRow isNewRow />}
      {data.map((row, index) => (
        <DataGridRow key={index} row={row} rowIndex={index} />
      ))}
      {!creation.isCreating && data.length === 0 && (
        <tr>
          <td colSpan={100} className="text-center py-8 text-muted-foreground">
            No data available
          </td>
        </tr>
      )}
    </TableBody>
  );
}
