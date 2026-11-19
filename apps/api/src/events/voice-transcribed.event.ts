type VoiceTranscribedPayload = {
  userId: number;
  /** Length of the recording, as Whisper reports it */
  seconds: number;
};

/** A voice note was transcribed on the instance's OpenAI key. */
export class VoiceTranscribedEvent {
  static readonly SLUG = 'ai.voice-transcribed';

  constructor(public readonly payload: VoiceTranscribedPayload) {}
}
