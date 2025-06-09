import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';

const SummaryPage = () => {
  const { meetingId } = useParams();
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/features/summary/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(response.data.summary.summaryText);
      } catch (err) {
        setError('Failed to load summary');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [meetingId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/features/summary', {
        meetingId,
        summaryText: summary,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Summary saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save summary');
      setSuccess('');
    }
  };

  if (loading) return <Layout><Typography>Loading summary...</Typography></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SummarizeIcon sx={{ fontSize: 40, mr: 1, color: '#7b1fa2' }} />
          <Typography variant="h4" component="h2">Summary</Typography>
        </Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          multiline
          minRows={12}
          fullWidth
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          variant="outlined"
        />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
          Save Summary
        </Button>
      </Box>
    </Layout>
  );
};

export default SummaryPage;
