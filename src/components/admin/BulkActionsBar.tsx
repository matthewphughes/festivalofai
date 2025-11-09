import { Button } from "@/components/ui/button";
import { Users, Shield, Mic, User as UserIcon, X, Video } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkRoleAssign: (role: string) => void;
  onBulkReplayAccess: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onBulkRoleAssign,
  onBulkReplayAccess,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
      <span className="font-medium">{selectedCount} user{selectedCount !== 1 ? 's' : ''} selected</span>
      
      <div className="h-6 w-px bg-primary-foreground/20" />
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onBulkRoleAssign("admin")}
        >
          <Shield className="mr-2 h-4 w-4" />
          Add Admin Role
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onBulkRoleAssign("speaker")}
        >
          <Mic className="mr-2 h-4 w-4" />
          Add Speaker Role
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onBulkRoleAssign("attendee")}
        >
          <Users className="mr-2 h-4 w-4" />
          Add Attendee Role
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onBulkReplayAccess}
        >
          <Video className="mr-2 h-4 w-4" />
          Grant Replay Access
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
