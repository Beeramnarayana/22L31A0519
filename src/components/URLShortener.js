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
  Divider,
  CircularProgress
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
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            mb: 2
          }}
        >
          🚀 URL Shortener
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            maxWidth: 600, 
            mx: 'auto',
            lineHeight: 1.6,
            mb: 3
          }}
        >
          Transform long URLs into short, shareable links with custom validity periods and analytics
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 2, 
          flexWrap: 'wrap',
          mb: 4
        }}>
          <Chip 
            icon={<span>⚡</span>} 
            label="Lightning Fast" 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            icon={<span>🔒</span>} 
            label="Secure" 
            color="secondary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            icon={<span>📊</span>} 
            label="Analytics" 
            color="success" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              📝
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                URL Inputs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {urls.length}/5 URLs • Add up to 5 URLs at once
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={clearResults}
              disabled={isProcessing}
              startIcon={<span>🗑️</span>}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Clear
            </Button>
            <Button
              variant="outlined"
              onClick={debugRedirection}
              disabled={isProcessing}
              startIcon={<span>🧪</span>}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Test
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addUrlRow}
              disabled={urls.length >= 5 || isProcessing}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Add URL
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {urls.map((url, index) => (
            <Grid item xs={12} key={url.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1rem',
                      mr: 2
                    }}>
                      {index + 1}
                    </Box>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                      URL #{index + 1}
                    </Typography>
                    {urls.length > 1 && (
                      <Tooltip title="Remove this URL">
                        <IconButton
                          size="small"
                          onClick={() => removeUrlRow(url.id)}
                          disabled={isProcessing}
                          sx={{ 
                            color: '#ef4444',
                            '&:hover': {
                              backgroundColor: '#fef2f2',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="🌐 Original URL"
                        placeholder="https://example.com"
                        value={url.originalUrl}
                        onChange={(e) => updateUrlField(url.id, 'originalUrl', e.target.value)}
                        disabled={isProcessing}
                        error={!!url.error}
                        helperText={url.error || 'Enter a valid HTTP/HTTPS URL'}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="⏰ Validity (minutes)"
                        type="number"
                        value={url.validityMinutes}
                        onChange={(e) => updateUrlField(url.id, 'validityMinutes', parseInt(e.target.value) || 30)}
                        disabled={isProcessing}
                        inputProps={{ min: 1 }}
                        helperText="Default: 30 minutes"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="🏷️ Custom Shortcode (optional)"
                        placeholder="mycode"
                        value={url.customShortcode}
                        onChange={(e) => updateUrlField(url.id, 'customShortcode', e.target.value)}
                        disabled={isProcessing}
                        helperText="3-20 alphanumeric characters"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Results Display */}
                  {url.result && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 3 }} />
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: '1.5rem'
                          }
                        }}
                        icon={<span>🎉</span>}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          URL shortened successfully!
                        </Typography>
                        <Typography variant="body2">
                          Your short URL is ready to share
                        </Typography>
                      </Alert>
                      
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 3, 
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          border: '1px solid #0ea5e9',
                          borderRadius: 2
                        }}
                      >
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}>
                                🔗
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  Short URL
                                </Typography>
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    wordBreak: 'break-all',
                                    color: '#0ea5e9'
                                  }}
                                >
                                  {url.result.shortUrl}
                                </Typography>
                              </Box>
                              <Tooltip title="Copy short URL">
                                <IconButton
                                  size="small"
                                  onClick={() => copyToClipboard(url.result.shortUrl)}
                                  sx={{
                                    backgroundColor: '#0ea5e9',
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: '#0284c7',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <CopyIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}>
                                ⏰
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  Expires
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {new Date(url.result.expiresAt).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
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

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={processUrls}
            disabled={isProcessing || urls.every(url => !url.originalUrl.trim())}
            sx={{ 
              minWidth: 250,
              py: 2,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: '#e2e8f0',
                color: '#94a3b8',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <span>🚀</span>}
          >
            {isProcessing ? 'Processing...' : 'Shorten URLs'}
          </Button>
          
          {urls.every(url => !url.originalUrl.trim()) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Enter at least one URL to get started
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Summary */}
      {urls.some(url => url.result) && (
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #22c55e',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              📊
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Processing Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Here's what happened with your URLs
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<span>✅</span>}
              label={`${urls.filter(url => url.result).length} Successful`}
              color="success"
              variant="filled"
              sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                py: 2,
                px: 1
              }}
            />
            {urls.filter(url => url.error).length > 0 && (
              <Chip
                icon={<span>❌</span>}
                label={`${urls.filter(url => url.error).length} Failed`}
                color="error"
                variant="filled"
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 2,
                  px: 1
                }}
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default URLShortener;
