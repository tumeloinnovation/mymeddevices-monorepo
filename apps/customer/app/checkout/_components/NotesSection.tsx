'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface NotesSectionProps {
  notes: string;
  setNotes: (notes: string) => void;
  disabled?: boolean;
}

export default function NotesSection({ notes, setNotes, disabled = false }: NotesSectionProps) {
  const maxLength = 500;
  const remaining = maxLength - notes.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="order-notes" className="text-base font-medium">
          Order Notes (Optional)
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Add any special delivery instructions for your order (e.g., estate gate code, landmark, or preferred time).
      </p>
      <Textarea
        id="order-notes"
        placeholder="E.g., Please call before delivery, leave at gate, special handling instructions..."
        value={notes}
        onChange={(e) => {
          const value = e.target.value;
          if (value.length <= maxLength) {
            setNotes(value);
          }
        }}
        disabled={disabled}
        rows={3}
        className="resize-none"
      />
      <div className="flex justify-end">
        <span className={`text-xs ${remaining < 20 ? 'text-orange-600' : 'text-muted-foreground'}`}>
          {remaining} character{remaining !== 1 ? 's' : ''} remaining
        </span>
      </div>
    </div>
  );
}
