import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import urlService from '../services/urlService';
import logger from '../utils/logger';

const Statistics = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  logger.info('Statistics component mounted');

  // Load all URLs
  const loadURLs = () => {
    try {
      setLoading(true);
      setError(null);
      
      const allURLs = urlService.getAllURLs();
      setUrls(allURLs);
      
      logger.info('Loaded URLs for statistics', { count: allURLs.length });
    } catch (err) {
      setError('Failed to load URL statistics');
      logger.error('Failed to load URL statistics', { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Load URLs on component mount
  useEffect(() => {
    loadURLs();
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      logger.info('Copied to clipboard', { text });
    }).catch(err => {
      logger.error('Failed to copy to clipboard', { error: err.message });
    });
  };

  // Get status chip for URL
  const getStatusChip = (url) => {
    const now = new Date();
    const isExpired = now > new Date(url.expiresAt);
    
    if (isExpired) {
      return <Chip label="Expired" color="error" size="small" />;
    } else {
      return <Chip label="Active" color="success" size="small" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get click source icon
  const getClickSourceIcon = (source) => {
    switch (source.toLowerCase()) {
      case 'direct':
        return <LinkIcon />;
      default:
        return <VisibilityIcon />;
    }
  };

  // Get detailed statistics for a URL
  const getDetailedStats = (url) => {
    const stats = urlService.getURLStats(url.shortcode);
    return stats || url;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Loading statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadURLs}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          URL Statistics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadURLs}
        >
          Refresh
        </Button>
      </Box>

      {urls.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No URLs Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create some shortened URLs to see their statistics here.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total URLs
                  </Typography>
                  <Typography variant="h4">
                    {urls.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active URLs
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {urls.filter(url => new Date() <= new Date(url.expiresAt)).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Expired URLs
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {urls.filter(url => new Date() > new Date(url.expiresAt)).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Clicks
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {urls.reduce((total, url) => total + url.clickCount, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* URLs Table */}
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Short URL</TableCell>
                    <TableCell>Original URL</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                    <TableCell>Clicks</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {urls.map((url) => {
                    return (
                      <TableRow key={url.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {url.shortUrl}
                            </Typography>
                            <Tooltip title="Copy short URL">
                              <IconButton
                                size="small"
                                onClick={() => copyToClipboard(url.shortUrl)}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title={url.originalUrl}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {url.originalUrl}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusChip(url)}
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(url.createdAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(url.expiresAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2" color="primary">
                            {url.clickCount}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Tooltip title="View detailed statistics">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // This would open a detailed view or modal
                                logger.info('Viewing detailed stats', { shortcode: url.shortcode });
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Detailed Click Analytics */}
          {urls.some(url => url.clickCount > 0) && (
            <Paper elevation={3} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
                Detailed Click Analytics
              </Typography>
              
              {urls
                .filter(url => url.clickCount > 0)
                .map((url) => {
                  const detailedStats = getDetailedStats(url);
                  return (
                    <Accordion key={url.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                            {url.shortUrl}
                          </Typography>
                          <Chip 
                            label={`${url.clickCount} clicks`} 
                            color="primary" 
                            size="small" 
                          />
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        {detailedStats.clicks && detailedStats.clicks.length > 0 ? (
                          <List>
                            {detailedStats.clicks.map((click, index) => (
                              <React.Fragment key={index}>
                                <ListItem>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimeIcon fontSize="small" color="action" />
                                        <Typography variant="body2">
                                          {formatDate(click.timestamp)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          {getClickSourceIcon(click.source)}
                                          <Typography variant="caption" color="text.secondary">
                                            Source: {click.source}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <LocationIcon fontSize="small" color="action" />
                                          <Typography variant="caption" color="text.secondary">
                                            Location: {click.location}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                  />
                                </ListItem>
                                {index < detailedStats.clicks.length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No click data available
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Statistics;
