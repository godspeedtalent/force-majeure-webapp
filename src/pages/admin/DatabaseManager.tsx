import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';

/**
 * Example page showing the Global Resource Search component
 * This can be integrated into the admin dashboard or database manager
 */
export function DatabaseManager() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Manager</h1>
        <p className="text-muted-foreground">
          Search across all resources - users, artists, venues, events, and organizations
        </p>
      </div>

      {/* Global Search Bar */}
      <div className="mb-8 flex justify-center">
        <GlobalResourceSearch />
      </div>

      {/* Additional content can go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <p className="text-sm text-muted-foreground">
            View analytics and statistics for your database
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Recent Changes</h3>
          <p className="text-sm text-muted-foreground">
            Track recent updates and modifications
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Batch Operations</h3>
          <p className="text-sm text-muted-foreground">
            Perform bulk actions on resources
          </p>
        </div>
      </div>
    </div>
  );
}
