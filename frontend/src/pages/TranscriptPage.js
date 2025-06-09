import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

const TranscriptPage = () => {
  const { meetingId } = useParams();
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/features/transcription/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTranscript(response.data.transcription.transcriptText);
      } catch (err) {
        setError('Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [meetingId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/features/transcription', {
        meetingId,
        transcriptText: transcript,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Transcript saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save transcript');
      setSuccess('');
    }
  };

  if (loading) return <Layout><Typography>Loading transcript...</Typography></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DescriptionIcon sx={{ fontSize: 40, mr: 1, color: '#1976d2' }} />
          <Typography variant="h4" component="h2">Transcript</Typography>
        </Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          multiline
          minRows={15}
          fullWidth
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          variant="outlined"
        />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
          Save Transcript
        </Button>
      </Box>
    </Layout>
  );
};

export default TranscriptPage;
