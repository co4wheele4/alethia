import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import { AiExtractionSuggestionItem } from '../../documents/hooks/useDocumentChunks';
import { useExtraction } from '../hooks/useExtraction';

interface Props {
  chunkId: string;
  suggestions: AiExtractionSuggestionItem[];
  onRefresh?: () => void;
}

export const SuggestedExtractionsPanel: React.FC<Props> = ({
  chunkId,
  suggestions,
  onRefresh,
}) => {
  const { proposeExtraction, acceptSuggestion, rejectSuggestion, loading } = useExtraction();

  const pendingSuggestions = suggestions.filter((s) => s.status === 'PENDING');

  const handlePropose = async () => {
    await proposeExtraction(chunkId);
    onRefresh?.();
  };

  const handleAccept = async (id: string) => {
    await acceptSuggestion(id);
    onRefresh?.();
  };

  const handleReject = async (id: string) => {
    await rejectSuggestion(id);
    onRefresh?.();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AiIcon fontSize="small" color="primary" />
          AI Suggestions
        </Typography>
        <Button
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : <AiIcon />}
          onClick={handlePropose}
          disabled={loading}
          variant="outlined"
        >
          Propose
        </Button>
      </Stack>

      {pendingSuggestions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
          No pending suggestions for this chunk.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {pendingSuggestions.map((suggestion) => (
            <Card key={suggestion.id} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
              <CardContent sx={{ p: '12px !important' }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box sx={{ flexGrow: 1 }}>
                    {suggestion.kind === 'ENTITY_MENTION' ? (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Entity Mention
                        </Typography>
                        <Typography variant="body2">
                          <strong>{suggestion.entityName}</strong> ({suggestion.entityType})
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Relationship
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>{suggestion.subjectName}</strong> 
                          <Chip label={suggestion.relation} size="small" sx={{ mx: 0.5, height: 20 }} />
                          <strong>{suggestion.objectName}</strong>
                        </Typography>
                      </Box>
                    )}
                    
                    {suggestion.excerpt && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{
                          mt: 1,
                          p: 0.5,
                          bgcolor: 'background.paper',
                          borderRadius: 0.5,
                          borderLeft: '2px solid',
                          borderColor: 'primary.main',
                          fontStyle: 'italic',
                        }}
                      >
                        &quot;{suggestion.excerpt}&quot;
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="column" spacing={0.5}>
                    <Tooltip title="Accept">
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={() => handleAccept(suggestion.id)}
                        disabled={loading}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleReject(suggestion.id)}
                        disabled={loading}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
