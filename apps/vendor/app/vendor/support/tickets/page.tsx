'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MessageSquare, Eye, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { supportApi } from '@/lib/api/endpoints/support';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

export default function VendorTicketsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['vendor-tickets', search, page],
    queryFn: () => supportApi.getTickets({ page, limit: 20 }),
  });

  const tickets = ticketsData?.items || [];
  const total = ticketsData?.total || 0;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage your support requests</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LifeBuoy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No support tickets</p>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket: any) => (
                <Link key={ticket.id} href={`/vendor/support/tickets/${ticket.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{ticket.subject}</span>
                      <Badge className={`text-[10px] px-2 py-0.5 capitalize ${statusColors[ticket.status] || ''}`}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ticket.ticket_number} &middot; {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {total > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
