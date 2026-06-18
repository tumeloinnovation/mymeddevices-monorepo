'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, ChevronLeft, MessageSquare, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { customerTicketsApi } from '@/lib/api/endpoints/tickets';

const statusBadge: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  waiting_on_customer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

const categoryLabels: Record<string, string> = {
  order_support: 'Order Support',
  product_inquiry: 'Product Inquiry',
  account_support: 'Account Support',
  vendor_inquiry: 'Vendor Inquiry',
  technical_support: 'Technical Support',
  billing: 'Billing',
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => customerTicketsApi.getTicket(id),
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => customerTicketsApi.addReply(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setReply('');
      toast.success('Reply sent');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => customerTicketsApi.closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Ticket closed');
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

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Ticket not found</h2>
        <p className="text-muted-foreground mt-1">The ticket you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tickets">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <Badge className={`capitalize ${statusBadge[ticket.status] || ''}`}>
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ticket.ticket_number} &middot; {categoryLabels[ticket.category] || ticket.category}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.replies && ticket.replies.length > 0 ? (
            ticket.replies.map((reply) => (
              <div key={reply.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {reply.is_internal ? 'Staff Note' : 'Support Reply'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {reply.created_at ? new Date(reply.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No replies yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
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
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
              >
                Close Ticket
              </Button>
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

      {ticket.attachments && ticket.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticket.attachments.map((att) => (
                <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Paperclip className="h-4 w-4" />
                  {att.file_name}
                  <span className="text-xs text-muted-foreground">
                    ({(att.file_size / 1024).toFixed(1)} KB)
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
