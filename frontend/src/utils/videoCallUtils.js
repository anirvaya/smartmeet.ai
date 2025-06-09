/**
 * Utility functions for WebRTC video call and AssemblyAI transcription integration.
 */

let mediaRecorder;
let recordedChunks = [];
let assemblyAIWebSocket;

export async function initializeWebRTC(roomId, addOrUpdateStream, setSpeakers) {
  try {
    // Get local media stream (camera and microphone)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    addOrUpdateStream({ id: 'local', stream, muted: false, videoOff: false, username: 'You' });
    // For now, just set a dummy speaker list
    setSpeakers([{ name: 'Local User', language: 'Unknown' }]);
    console.log('WebRTC initialized with local stream for room:', roomId);
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
  }
}

export function startAssemblyAITranscription(roomId, setTranscription) {
  // AssemblyAI real-time transcription WebSocket integration with audio streaming
  const token = 'bece091d5b274a95b71cf2f70c81f1b0'; // Replace with your AssemblyAI API token
  const url = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';

  assemblyAIWebSocket = new WebSocket(url);

  let audioContext;
  let processor;
  let input;
  let globalStream;

  assemblyAIWebSocket.onopen = () => {
    console.log('AssemblyAI WebSocket connection opened');
    // Send start stream message
    if (assemblyAIWebSocket.readyState === WebSocket.OPEN) {
      assemblyAIWebSocket.send(JSON.stringify({ type: 'StartStream', data: { language_code: 'en_us' } }));
    } else {
      console.error('WebSocket not open yet, cannot send StartStream message');
    }

    // Start capturing audio from microphone
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      globalStream = stream;
      input = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      input.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const floatSamples = e.inputBuffer.getChannelData(0);
        const int16Samples = convertFloat32ToInt16(floatSamples);
        if (assemblyAIWebSocket.readyState === WebSocket.OPEN) {
          assemblyAIWebSocket.send(int16Samples);
        }
      };
    }).catch((err) => {
      console.error('Error accessing microphone for transcription:', err);
    });
  };

  assemblyAIWebSocket.onerror = (error) => {
    console.error('AssemblyAI WebSocket error:', error);
  };

  assemblyAIWebSocket.onclose = (event) => {
    console.log('AssemblyAI WebSocket connection closed', event);
    if (processor) {
      processor.disconnect();
    }
    if (input) {
      input.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (globalStream) {
      globalStream.getTracks().forEach(track => track.stop());
    }
  };

  assemblyAIWebSocket.onmessage = (message) => {
    const res = JSON.parse(message.data);
    if (res.message_type === 'FinalTranscript') {
      setTranscription(res.text);
    }
  };

  assemblyAIWebSocket.onerror = (error) => {
    console.error('AssemblyAI WebSocket error:', error);
  };

  assemblyAIWebSocket.onclose = () => {
    console.log('AssemblyAI WebSocket connection closed');
    if (processor) {
      processor.disconnect();
    }
    if (input) {
      input.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (globalStream) {
      globalStream.getTracks().forEach(track => track.stop());
    }
  };
}

// Helper function to convert Float32Array to Int16Array buffer
function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
  }
  return buf.buffer;
}

export function stopAssemblyAITranscription() {
  if (assemblyAIWebSocket) {
    assemblyAIWebSocket.close();
  }
}

export function startRecording(stream, onDataAvailable, onStop) {
  if (!stream) {
    console.error('No stream available for recording');
    return;
  }
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
      if (onDataAvailable) onDataAvailable(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    if (onStop) onStop(blob);
  };
  mediaRecorder.start();
  console.log('Recording started');
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Recording stopped');
  }
}
