'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, ChevronLeft, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supportApi } from '@/lib/api/endpoints/support';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

export default function VendorTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['vendor-ticket', id],
    queryFn: () => supportApi.getTicket(id),
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => supportApi.replyToTicket(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-ticket', id] });
      setReply('');
      toast.success('Reply sent');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Ticket not found</h2>
        <Button asChild className="mt-4">
          <Link href="/vendor/support/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/support/tickets">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{(ticket as any).subject || 'Ticket'}</h1>
            <Badge className={`capitalize ${statusColors[(ticket as any).status] || ''}`}>
              {(ticket as any).status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {(ticket as any).ticket_number}
          </p>
        </div>
      </div>

      {ticket.messages && ticket.messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.map((msg: any) => (
              <div key={msg.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {msg.sender}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(ticket as any).status !== 'closed' && (ticket as any).status !== 'resolved' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Reply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => replyMutation.mutate(reply)}
                disabled={!reply.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Send Reply</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
