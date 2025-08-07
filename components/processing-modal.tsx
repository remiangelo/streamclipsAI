'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { JobProgress } from '@/components/job-progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  vodId?: string;
}

export function ProcessingModal({ isOpen, onClose, jobId, vodId }: ProcessingModalProps) {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    setIsComplete(true);
    // Refresh the page data
    router.refresh();
  };

  const handleViewClips = () => {
    if (vodId) {
      router.push(`/dashboard/vods/${vodId}/clips`);
    } else {
      router.push('/dashboard/clips');
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setIsComplete(false);
    }
  }, [isOpen]);

  if (!jobId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processing Video</DialogTitle>
        </DialogHeader>
        
        <JobProgress 
          jobId={jobId} 
          title="Analyzing and extracting clips"
          onComplete={handleComplete}
        />

        {isComplete && (
          <div className="flex gap-2 mt-4">
            <Button onClick={handleViewClips} className="flex-1">
              View Clips
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}