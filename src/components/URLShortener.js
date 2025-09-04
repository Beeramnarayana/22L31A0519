import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import urlService from '../services/urlService';
import logger from '../utils/logger';

const URLShortener = () => {
  const [urls, setUrls] = useState([
    { id: 1, originalUrl: '', validityMinutes: 30, customShortcode: '', result: null, error: null }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  logger.info('URL Shortener component mounted');

  // Add new URL input row
  const addUrlRow = () => {
    if (urls.length >= 5) {
      logger.warn('Maximum URL limit reached', { currentCount: urls.length });
      return;
    }

    const newId = Math.max(...urls.map(u => u.id)) + 1;
    setUrls([...urls, {
      id: newId,
      originalUrl: '',
      validityMinutes: 30,
      customShortcode: '',
      result: null,
      error: null
    }]);

    logger.info('Added new URL input row', { newId, totalRows: urls.length + 1 });
  };

  // Remove URL input row
  const removeUrlRow = (id) => {
    if (urls.length <= 1) {
      logger.warn('Cannot remove the last URL input row');
      return;
    }

    setUrls(urls.filter(url => url.id !== id));
    logger.info('Removed URL input row', { removedId: id, remainingRows: urls.length - 1 });
  };

  // Update URL input field
  const updateUrlField = (id, field, value) => {
    setUrls(urls.map(url => {
      if (url.id === id) {
        return { ...url, [field]: value, error: null, result: null };
      }
      return url;
    }));

    logger.debug('Updated URL field', { id, field, value });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      logger.info('Copied to clipboard', { text });
    }).catch(err => {
      logger.error('Failed to copy to clipboard', { error: err.message });
    });
  };

  // Validate all URLs before processing
  const validateAllUrls = () => {
    const validUrls = urls.filter(url => url.originalUrl.trim());
    
    if (validUrls.length === 0) {
      logger.warn('No URLs provided for shortening');
      return false;
    }

    // Validate each URL
    for (const url of validUrls) {
      if (!urlService.validateURL(url.originalUrl)) {
        setUrls(urls.map(u => 
          u.id === url.id 
            ? { ...u, error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.' }
            : u
        ));
        return false;
      }

      if (!Number.isInteger(url.validityMinutes) || url.validityMinutes <= 0) {
        setUrls(urls.map(u => 
          u.id === url.id 
            ? { ...u, error: 'Validity period must be a positive integer (minutes).' }
            : u
        ));
        return false;
      }

      if (url.customShortcode && !urlService.validateShortcode(url.customShortcode)) {
        setUrls(urls.map(u => 
          u.id === url.id 
            ? { ...u, error: 'Invalid shortcode format. Use 3-20 alphanumeric characters.' }
            : u
        ));
        return false;
      }
    }

    logger.info('All URLs validated successfully', { count: validUrls.length });
    return true;
  };

  // Process all URLs
  const processUrls = async () => {
    if (!validateAllUrls()) {
      return;
    }

    setIsProcessing(true);
    logger.info('Starting URL processing', { urlCount: urls.length });

    const validUrls = urls.filter(url => url.originalUrl.trim());
    const results = [];

    for (const url of validUrls) {
      try {
        const result = urlService.createShortURL(
          url.originalUrl,
          url.validityMinutes,
          url.customShortcode || null
        );

        if (result.success) {
          results.push({ id: url.id, result: result.data, error: null });
          logger.info('URL shortened successfully', { 
            id: url.id, 
            shortcode: result.data.shortcode,
            originalUrl: url.originalUrl 
          });
        } else {
          results.push({ id: url.id, result: null, error: result.error });
          logger.error('URL shortening failed', { 
            id: url.id, 
            error: result.error,
            originalUrl: url.originalUrl 
          });
        }
      } catch (error) {
        results.push({ id: url.id, result: null, error: 'An unexpected error occurred.' });
        logger.error('Unexpected error during URL shortening', { 
          id: url.id, 
          error: error.message,
          originalUrl: url.originalUrl 
        });
      }
    }

    // Update state with results
    setUrls(urls.map(url => {
      const result = results.find(r => r.id === url.id);
      return result ? { ...url, ...result } : url;
    }));

    setIsProcessing(false);
    logger.info('URL processing completed', { 
      total: validUrls.length, 
      successful: results.filter(r => r.result).length,
      failed: results.filter(r => r.error).length 
    });
  };

  // Clear all results
  const clearResults = () => {
    setUrls(urls.map(url => ({ ...url, result: null, error: null })));
    logger.info('Cleared all results');
  };

  // Debug function to test redirection
  const debugRedirection = () => {
    const allURLs = urlService.debugGetAllURLs();
    logger.info('Debug: Testing redirection with stored URLs', { allURLs });
    
    if (allURLs.length > 0) {
      const firstUrl = allURLs[0];
      logger.info('Debug: Testing redirection to', { shortcode: firstUrl.shortcode, shortUrl: firstUrl.shortUrl });
      window.open(firstUrl.shortUrl, '_blank');
    } else {
      logger.warn('Debug: No URLs available for testing');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        URL Shortener
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Shorten up to 5 URLs simultaneously with custom validity periods and shortcodes
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            URL Inputs ({urls.length}/5)
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={clearResults}
              disabled={isProcessing}
              sx={{ mr: 1 }}
            >
              Clear Results
            </Button>
            <Button
              variant="outlined"
              onClick={debugRedirection}
              disabled={isProcessing}
              sx={{ mr: 1 }}
            >
              Test Redirection
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addUrlRow}
              disabled={urls.length >= 5 || isProcessing}
            >
              Add URL
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {urls.map((url, index) => (
            <Grid item xs={12} key={url.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      URL #{index + 1}
                    </Typography>
                    {urls.length > 1 && (
                      <Tooltip title="Remove this URL">
                        <IconButton
                          size="small"
                          onClick={() => removeUrlRow(url.id)}
                          disabled={isProcessing}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Original URL"
                        placeholder="https://example.com"
                        value={url.originalUrl}
                        onChange={(e) => updateUrlField(url.id, 'originalUrl', e.target.value)}
                        disabled={isProcessing}
                        error={!!url.error}
                        helperText={url.error || 'Enter a valid HTTP/HTTPS URL'}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Validity (minutes)"
                        type="number"
                        value={url.validityMinutes}
                        onChange={(e) => updateUrlField(url.id, 'validityMinutes', parseInt(e.target.value) || 30)}
                        disabled={isProcessing}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Custom Shortcode (optional)"
                        placeholder="mycode"
                        value={url.customShortcode}
                        onChange={(e) => updateUrlField(url.id, 'customShortcode', e.target.value)}
                        disabled={isProcessing}
                        helperText="3-20 alphanumeric characters"
                      />
                    </Grid>
                  </Grid>

                  {/* Results Display */}
                  {url.result && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Alert severity="success" sx={{ mb: 2 }}>
                        URL shortened successfully!
                      </Alert>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinkIcon color="primary" />
                            <Typography variant="body2" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
                              {url.result.shortUrl}
                            </Typography>
                            <Tooltip title="Copy short URL">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(url.result.shortUrl)}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon color="action" />
                            <Typography variant="body2">
                              Expires: {new Date(url.result.expiresAt).toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {url.error && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Alert severity="error">
                        {url.error}
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={processUrls}
            disabled={isProcessing || urls.every(url => !url.originalUrl.trim())}
            sx={{ minWidth: 200 }}
          >
            {isProcessing ? 'Processing...' : 'Shorten URLs'}
          </Button>
        </Box>
      </Paper>

      {/* Summary */}
      {urls.some(url => url.result) && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${urls.filter(url => url.result).length} Successful`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${urls.filter(url => url.error).length} Failed`}
              color="error"
              variant="outlined"
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default URLShortener;
