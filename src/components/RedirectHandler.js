import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Paper,
  Button
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import logger from '../utils/logger';

const RedirectHandler = () => {
  const { shortcode } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');

  logger.info('Redirect handler activated', { shortcode });

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        if (!shortcode) {
          setStatus('error');
          setError('Invalid short URL');
          logger.error('No shortcode provided for redirect');
          return;
        }

        logger.info('Attempting to redirect', { shortcode });

        // Get the original URL
        const result = urlService.getOriginalURL(shortcode);

        if (result.success) {
          setStatus('success');
          setOriginalUrl(result.data.originalUrl);
          
          logger.info('Redirect successful', { 
            shortcode, 
            originalUrl: result.data.originalUrl 
          });

          // Redirect immediately
          window.location.href = result.data.originalUrl;
        } else {
          setStatus('error');
          setError(result.error);
          logger.error('Redirect failed', { shortcode, error: result.error });
        }
      } catch (err) {
        setStatus('error');
        setError('An unexpected error occurred');
        logger.error('Unexpected error during redirect', { 
          shortcode, 
          error: err.message 
        });
      }
    };

    handleRedirect();
  }, [shortcode]);

  const handleGoHome = () => {
    navigate('/');
    logger.info('User navigated to home from redirect handler');
  };

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Redirecting...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we redirect you to your destination.
        </Typography>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2
        }}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h5" gutterBottom color="success.main">
            Redirecting...
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are being redirected to:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-all',
              backgroundColor: 'grey.100',
              p: 1,
              borderRadius: 1,
              mb: 2
            }}
          >
            {originalUrl}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you are not redirected automatically, 
            <Button 
              variant="text" 
              onClick={() => window.location.href = originalUrl}
              sx={{ ml: 1 }}
            >
              click here
            </Button>
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2
        }}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Redirect Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The short URL you're looking for could not be found or has expired.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return null;
};

export default RedirectHandler;
