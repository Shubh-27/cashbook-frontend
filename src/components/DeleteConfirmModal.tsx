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
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/80 bg-white">
        <DialogHeader className="flex flex-col items-center gap-2 text-center sm:text-left sm:items-start">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-1 text-rose-600">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <DialogTitle className="text-lg md:text-xl text-slate-900 font-bold">{title}</DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-slate-500">
            {description}
            {itemName && (
              <span className="block mt-2 font-semibold text-slate-800 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                "{itemName}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-3 border-t mt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl flex-1 sm:flex-none"
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
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex-1 sm:flex-none font-semibold shadow-sm"
          >
            Delete Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
