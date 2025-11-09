import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";

interface OrderBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
  onAddNotes: () => void;
}

export const OrderBulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onExportSelected,
  onAddNotes,
}: OrderBulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
      <span className="font-medium">{selectedCount} order{selectedCount !== 1 ? 's' : ''} selected</span>
      
      <div className="h-6 w-px bg-primary-foreground/20" />
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onExportSelected}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Selected
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onAddNotes}
        >
          <FileText className="mr-2 h-4 w-4" />
          Add Notes
        </Button>
      </div>
      
      <div className="h-6 w-px bg-primary-foreground/20" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        className="hover:bg-primary-foreground/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
