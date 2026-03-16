import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-rose-100">
        <DialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <DialogTitle className="text-xl text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
            {itemName && (
              <span className="block mt-2 font-semibold text-slate-700">
                "{itemName}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end gap-3 pt-6 border-t mt-4">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-rose-600 hover:bg-rose-700 shadow-sm"
          >
            Delete Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
