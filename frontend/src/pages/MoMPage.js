import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

const MoMPage = () => {
  const { meetingId } = useParams();
  const [mom, setMom] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMoM = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/features/mom/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMom(response.data.mom.momText);
      } catch (err) {
        setError('Failed to load minutes of meeting');
      } finally {
        setLoading(false);
      }
    };
    fetchMoM();
  }, [meetingId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/features/mom', {
        meetingId,
        momText: mom,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Minutes of Meeting saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save minutes of meeting');
      setSuccess('');
    }
  };

  if (loading) return <Layout><Typography>Loading minutes of meeting...</Typography></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ fontSize: 40, mr: 1, color: '#00796b' }} />
          <Typography variant="h4" component="h2">Minutes of Meeting</Typography>
        </Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          multiline
          minRows={12}
          fullWidth
          value={mom}
          onChange={(e) => setMom(e.target.value)}
          variant="outlined"
        />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
          Save MoM
        </Button>
      </Box>
    </Layout>
  );
};

export default MoMPage;
