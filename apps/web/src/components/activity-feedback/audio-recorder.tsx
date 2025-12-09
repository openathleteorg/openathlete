import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { API_BASE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getAccessToken } from '@/utils/auth';
import { routes } from '@/utils/axios';
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface P {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
  setIsRecording: (isRecording: boolean) => void;
  setIsTranscribing: (isTranscribing: boolean) => void;
}

export function AudioRecorder({
  onTranscriptionComplete,
  disabled,
  setIsRecording: setIsRecordingProp,
  setIsTranscribing: setIsTranscribingProp,
}: P) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch {
      setHasPermission(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      toast.success(m.microphone_permission_granted());
    } catch {
      setHasPermission(false);
      toast.error(m.microphone_permission_denied());
    }
  };

  const startRecording = async () => {
    try {
      if (hasPermission === false) {
        await requestMicrophonePermission();
        if (hasPermission === false) {
          return;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/ogg',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsRecordingProp(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(m.failed_to_start_recording());
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingProp(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setIsTranscribingProp(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const token = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}${routes.event.transcribeAudio}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token?.accessToken || ''}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        onTranscriptionComplete(data.text);
        setIsTranscribingProp(false);
        toast.success(m.transcription_completed());
      } else {
        throw new Error('No transcription text received');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error(m.failed_to_transcribe_audio());
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (hasPermission === false) {
      requestMicrophonePermission();
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (isTranscribing) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader size="sm" />
        <span className="text-sm">{m.transcribing_audio()}</span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isTranscribing}
      className="gap-2"
    >
      {isRecording ? (
        <>
          <MicOff className="h-4 w-4" />
          {m.stop_recording()}
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          {hasPermission === false
            ? m.grant_microphone_permission()
            : m.start_recording()}
        </>
      )}
    </Button>
  );
}
