import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Edit, Save, X } from "lucide-react";

interface Replay {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string | null;
  event_year: number;
  speaker_name: string | null;
  speaker_id: string | null;
  duration_minutes: number | null;
  published: boolean;
}

interface Speaker {
  id: string;
  name: string;
  bio: string | null;
  title: string | null;
  company: string | null;
  image_url: string | null;
}

interface ReplayCardProps {
  replay: Replay;
  isEditing: boolean;
  isAdmin: boolean;
  editForm: Partial<Replay>;
  speakers: Speaker[];
  onStartEdit: (replay: Replay) => void;
  onCancelEdit: () => void;
  onSaveEdit: (replayId: string) => void;
  onTogglePublished: (replayId: string, currentPublished: boolean) => void;
  onSpeakerClick: (speakerId: string | null) => void;
  onEditFormChange: (field: string, value: any) => void;
  getYouTubeEmbedUrl: (url: string) => string;
}

const ReplayCard = React.memo<ReplayCardProps>(({
  replay,
  isEditing,
  isAdmin,
  editForm,
  speakers,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTogglePublished,
  onSpeakerClick,
  onEditFormChange,
  getYouTubeEmbedUrl,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted">
        <iframe
          src={getYouTubeEmbedUrl(replay.video_url)}
          title={replay.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          {isEditing ? (
            <Input
              value={editForm.title || ""}
              onChange={(e) => onEditFormChange("title", e.target.value)}
              placeholder="Title"
              className="flex-1"
            />
          ) : (
            <CardTitle className="text-lg">{replay.title}</CardTitle>
          )}
          <div className="flex gap-2">
            <Badge variant="outline">{replay.event_year}</Badge>
            {isAdmin && !isEditing && (
              <Button size="sm" variant="ghost" onClick={() => onStartEdit(replay)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {isEditing ? (
          <Select
            value={editForm.speaker_id || "none"}
            onValueChange={(value) => onEditFormChange("speaker_id", value === "none" ? null : value)}
          >
            <SelectTrigger className="mb-2">
              <SelectValue placeholder="Select Speaker" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="none">No Speaker</SelectItem>
              {speakers.map((speaker) => (
                <SelectItem key={speaker.id} value={speaker.id}>
                  {speaker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          replay.speaker_name && (
            <button
              onClick={() => onSpeakerClick(replay.speaker_id)}
              className="text-sm font-medium text-primary hover:underline cursor-pointer text-left"
            >
              by {replay.speaker_name}
            </button>
          )
        )}
        {isEditing ? (
          <Textarea
            value={editForm.description || ""}
            onChange={(e) => onEditFormChange("description", e.target.value)}
            placeholder="Description"
            rows={3}
          />
        ) : (
          replay.description && (
            <CardDescription className="line-clamp-2">
              {replay.description}
            </CardDescription>
          )
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editForm.duration_minutes || ""}
                onChange={(e) => onEditFormChange("duration_minutes", parseInt(e.target.value) || null)}
                placeholder="Duration (minutes)"
                className="w-32"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.published || false}
                  onChange={(e) => onEditFormChange("published", e.target.checked)}
                  className="rounded"
                />
                Published
              </label>
            </div>
          ) : (
            replay.duration_minutes && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {replay.duration_minutes} min
              </div>
            )
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSaveEdit(replay.id)} className="flex-1">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {!replay.published && (
                <Badge variant="secondary">Unpublished</Badge>
              )}
              {isAdmin && (
                <Button 
                  size="sm" 
                  variant={replay.published ? "outline" : "default"}
                  onClick={() => onTogglePublished(replay.id, replay.published)}
                >
                  {replay.published ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ReplayCard.displayName = "ReplayCard";

export default ReplayCard;
