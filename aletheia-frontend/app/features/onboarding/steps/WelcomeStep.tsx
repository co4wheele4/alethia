'use client';

import { Alert, Box, List, ListItem, ListItemText, Typography } from '@mui/material';

export function WelcomeStep() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Welcome.</Typography>

      <Alert severity="info">
        Aletheia is evidence-first. It helps you <strong>store</strong>, <strong>inspect</strong>, and{" "}
        <strong>reference</strong> sources. It does not “know” what is true unless your sources support it.
      </Alert>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          What Aletheia does
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="Ingests documents into immutable text snapshots (chunked for inspection)." />
          </ListItem>
          <ListItem>
            <ListItemText primary="Shows provenance metadata alongside content." />
          </ListItem>
          <ListItem>
            <ListItemText primary="Keeps uncertainty visible and links outputs back to evidence." />
          </ListItem>
        </List>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          What Aletheia explicitly does not do
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText primary="It does not assert truth without sources you can inspect." />
          </ListItem>
          <ListItem>
            <ListItemText primary="It does not treat ingestion as “analysis.” Ingestion is only capture + indexing." />
          </ListItem>
          <ListItem>
            <ListItemText primary="It does not silently assume provenance, intent, or correctness." />
          </ListItem>
        </List>
      </Box>

      <Alert severity="warning">
        <strong>Truth requires evidence.</strong> This wizard helps you supply sources and describe how you obtained
        them—without asking you to provide conclusions.
      </Alert>
    </Box>
  );
}

