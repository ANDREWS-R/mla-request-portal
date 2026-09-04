import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Slider } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

export default function AudioRecorder({ onAudioRecorded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // Cleanup player audio url on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        
        // Pass to parent form
        // Create a File object from blob so it can be uploaded easily
        const audioFile = new File([audioBlob], 'voice_message.webm', {
          type: 'audio/webm',
          lastModified: Date.now()
        });
        onAudioRecorded(audioFile);
        
        // Stop all tracks in stream to release mic icon
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error opening microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    onAudioRecorded(null);
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ 
      p: 3, 
      borderRadius: 3, 
      backgroundColor: 'rgba(31, 41, 55, 0.3)', 
      border: '1px dashed rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      {!audioUrl ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          {isRecording ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {/* Pulsing red record dot */}
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                backgroundColor: 'error.main',
                animation: 'pulseGlow 1s infinite ease-in-out',
                '@keyframes pulseGlow': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.5 },
                }
              }} />
              <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                Recording... {formatTime(recordTime)}
              </Typography>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<StopIcon />} 
                onClick={stopRecording}
                sx={{ mt: 1 }}
              >
                Stop Recording
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={startRecording}
                sx={{ 
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: 'primary.main',
                  width: 72,
                  height: 72,
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <MicIcon sx={{ fontSize: 36 }} />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Click to record voice message (max 2 mins)
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'medium' }}>
            ✓ Voice message recorded
          </Typography>
          
          <audio 
            ref={audioPlayerRef} 
            src={audioUrl} 
            onEnded={handleAudioEnded} 
            style={{ display: 'none' }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', justifyContent: 'center' }}>
            <IconButton onClick={togglePlayback} color="primary">
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Voice Note Preview
            </Typography>

            <IconButton onClick={deleteRecording} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
