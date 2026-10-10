import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { m } from '@/paraglide/messages';
import { getAccessToken } from '@/utils/auth';
import { routes } from '@/utils/axios';
import { getApiBaseUrl } from '@/utils/capacitor';
import { isAndroid, isCapacitor } from '@/utils/capacitor';
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
  const isNative = isCapacitor();

  useEffect(() => {
    checkMicrophonePermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkMicrophonePermission = async () => {
    if (isNative) {
      setHasPermission(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch {
      setHasPermission(false);
    }
  };

  const requestMicrophonePermission = async () => {
    if (isNative) {
      setHasPermission(null);
      return;
    }

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
      if (isNative && typeof MediaRecorder !== 'undefined') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          streamRef.current = stream;

          const mimeType = MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : MediaRecorder.isTypeSupported('audio/mp4')
              ? 'audio/mp4'
              : MediaRecorder.isTypeSupported('audio/ogg')
                ? 'audio/ogg'
                : 'audio/webm';

          const mediaRecorder = new MediaRecorder(stream, { mimeType });

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
          setHasPermission(true);
          return;
        } catch (mediaRecorderError) {
          console.error(
            'MediaRecorder failed on native platform, falling back to Capacitor plugin:',
            mediaRecorderError,
          );
        }
      }

      if (isNative) {
        const { VoiceRecorder } = await import('capacitor-voice-recorder');

        try {
          const permissionResult =
            await VoiceRecorder.requestAudioRecordingPermission();
          if (!permissionResult.value) {
            toast.error(m.microphone_permission_denied());
            setHasPermission(false);
            return;
          }

          await VoiceRecorder.startRecording();
          setIsRecording(true);
          setIsRecordingProp(true);
          setHasPermission(true);
        } catch (error) {
          console.error('Error starting Capacitor recording:', error);
          toast.error(m.failed_to_start_recording());
          setHasPermission(false);
        }
        return;
      }

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

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingProp(false);
      return;
    }

    if (isNative && isRecording) {
      try {
        const { VoiceRecorder } = await import('capacitor-voice-recorder');
        const result = await VoiceRecorder.stopRecording();

        if (result.value && result.value.recordDataBase64) {
          let base64Data = result.value.recordDataBase64;
          if (base64Data.includes(',')) {
            base64Data = base64Data.split(',')[1];
          }
          base64Data = base64Data.replace(/\\\//g, '/');

          try {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            const originalMimeType =
              result.value.mimeType ||
              (isAndroid() ? 'audio/3gp' : 'audio/m4a');

            let mimeType = originalMimeType;
            let isAndroidFormat = false;

            if (mimeType === 'audio/aac' || mimeType === 'audio/m4a') {
              mimeType = 'audio/mp4';
            } else if (
              mimeType === 'audio/3gp' ||
              mimeType === 'audio/amr' ||
              mimeType.includes('3gp')
            ) {
              mimeType = 'audio/mpeg';
              isAndroidFormat = true;
            }

            const audioBlob = new Blob([byteArray], { type: mimeType });
            (
              audioBlob as Blob & {
                _isM4A?: boolean;
                _isAndroidFormat?: boolean;
              }
            )._isM4A =
              originalMimeType === 'audio/aac' ||
              originalMimeType === 'audio/m4a';
            (
              audioBlob as Blob & {
                _isM4A?: boolean;
                _isAndroidFormat?: boolean;
              }
            )._isAndroidFormat = isAndroidFormat;

            if (audioBlob.size === 0) {
              throw new Error('Audio blob is empty');
            }

            setIsRecording(false);
            setIsRecordingProp(false);

            await transcribeAudio(audioBlob);
          } catch (conversionError) {
            console.error('Error converting base64 to blob:', conversionError);
            throw new Error(
              `Failed to convert audio data: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`,
            );
          }
        } else {
          console.error('Invalid recording result:', result);
          throw new Error('No recording data received');
        }
      } catch (error) {
        console.error('Error stopping Capacitor recording:', error);
        setIsRecording(false);
        setIsRecordingProp(false);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(`${m.failed_to_start_recording()}: ${errorMessage}`);
      }
      return;
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
      const isM4A = (
        audioBlob as Blob & { _isM4A?: boolean; _isAndroidFormat?: boolean }
      )._isM4A;
      const isAndroidFormat = (
        audioBlob as Blob & { _isM4A?: boolean; _isAndroidFormat?: boolean }
      )._isAndroidFormat;

      let extension = 'webm';
      if (isM4A) {
        extension = 'm4a';
      } else if (isAndroidFormat) {
        extension = 'mp3';
      } else if (audioBlob.type.includes('mp4')) {
        extension = 'mp4';
      } else if (
        audioBlob.type.includes('mpeg') ||
        audioBlob.type.includes('mp3')
      ) {
        extension = 'mp3';
      } else if (audioBlob.type.includes('3gp')) {
        extension = '3gp';
      } else if (audioBlob.type.includes('ogg')) {
        extension = 'ogg';
      } else if (audioBlob.type.includes('wav')) {
        extension = 'wav';
      }
      formData.append('audio', audioBlob, `recording.${extension}`);

      const token = await getAccessToken();

      const response = await fetch(
        `${getApiBaseUrl()}${routes.event.transcribeAudio}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token?.accessToken || ''}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Transcription failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`${response.status}: ${errorMessage}`);
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Transcription error details:', {
        error,
        errorMessage,
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });
      toast.error(`${m.failed_to_transcribe_audio()}: ${errorMessage}`);
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
