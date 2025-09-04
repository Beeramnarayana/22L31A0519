import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MuiLink } from '@mui/material';

import URLShortener from './components/URLShortener';
import Statistics from './components/Statistics';
import RedirectHandler from './components/RedirectHandler';
import logger from './utils/logger';

// Create Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  logger.info('Application started');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                URL Shortener
              </Typography>
              <MuiLink
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{ marginRight: 2, textDecoration: 'none' }}
              >
                Shorten URLs
              </MuiLink>
              <MuiLink
                component={RouterLink}
                to="/statistics"
                color="inherit"
                sx={{ textDecoration: 'none' }}
              >
                Statistics
              </MuiLink>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
            <Routes>
              <Route path="/" element={<URLShortener />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/:shortcode" element={<RedirectHandler />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
