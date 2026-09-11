'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorIcon from '@mui/icons-material/Error';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

import {
  getMyRequirements,
  getMyQuestions,
  submitAttestations,
  submitServiceForReview,
  requestDocumentUploadUrls,
  confirmDocumentUploads,
  getDocumentDownloadUrl,
} from '@/api/provider.api';
import type {
  VettingRequirement,
  VettingQuestion,
} from '@/types/provider';

type RequirementsByCategory = Record<string, VettingRequirement[]>;
type QuestionsByCategory = Record<string, VettingQuestion[]>;

interface UploadState {
  uploading: boolean;
  error: string | null;
  success: string | null;
}

export default function ProviderRequirementsPage() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") || undefined;
  const [requirements, setRequirements] = useState<VettingRequirement[]>([]);
  const [serviceRequirements, setServiceRequirements] = useState<VettingRequirement[]>([]);
  const [questions, setQuestions] = useState<VettingQuestion[]>([]);
  const [serviceQuestions, setServiceQuestions] = useState<VettingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attestationResponses, setAttestationResponses] = useState<Record<string, string>>({});
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const fileInputRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewDocument, setPreviewDocument] = useState<{ id: string; mimeType: string | null; fileName: string | null } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [providerVerificationStatus, setProviderVerificationStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [reqRes, qRes] = await Promise.all([
      getMyRequirements(serviceId),
      getMyQuestions(serviceId),
    ]);
    if (reqRes?.status === 200 && reqRes.data?.data?.requirements) {
      const reqs = reqRes.data.data.requirements;
      const sReqs = reqRes.data.data.serviceRequirements || [];
      setRequirements(reqs);
      setServiceRequirements(sReqs);
      setProviderVerificationStatus(reqRes.data.data.providerVerificationStatus || null);
      const initial: Record<string, string> = {};
      [...reqs, ...sReqs].forEach((r: VettingRequirement) => {
        if (r.type === 'attestation' && r.answer) {
          initial[r.id] = r.answer;
        } else if (r.type === 'attestation' && r.submissionStatus) {
          initial[r.id] = r.submissionStatus === 'approved' ? 'yes' : 'no';
        }
      });
      setAttestationResponses((prev) => ({ ...prev, ...initial }));
    } else {
      setError('Failed to load requirements.');
    }
    if (qRes?.status === 200 && qRes.data?.data?.questions) {
      const qs = qRes.data.data.questions;
      const sQs = qRes.data.data.serviceQuestions || [];
      setQuestions(qs);
      setServiceQuestions(sQs);
      const initialAnswers: Record<string, string | string[]> = {};
      [...qs, ...sQs].forEach((q: VettingQuestion) => {
        if (q.answer !== null) {
          initialAnswers[q.id] = q.type === 'multiple_choice'
            ? q.answer.split(',').filter(Boolean)
            : q.answer;
        }
      });
      setQuestionAnswers((prev) => ({ ...prev, ...initialAnswers }));
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    async function load() {
      await fetchData();
    }
    load();
  }, [fetchData, serviceId]);

  const allRequirements = [...requirements, ...serviceRequirements];
  const allQuestions = [...questions, ...serviceQuestions];

  const requirementsByCategory: RequirementsByCategory = {};
  requirements.forEach((r) => {
    if (!requirementsByCategory[r.categoryName]) {
      requirementsByCategory[r.categoryName] = [];
    }
    requirementsByCategory[r.categoryName].push(r);
  });

  const serviceRequirementsByService: RequirementsByCategory = {};
  serviceRequirements.forEach((r) => {
    const key = r.serviceName || 'Service';
    if (!serviceRequirementsByService[key]) {
      serviceRequirementsByService[key] = [];
    }
    serviceRequirementsByService[key].push(r);
  });

  const questionsByCategory: QuestionsByCategory = {};
  questions.forEach((q) => {
    if (!questionsByCategory[q.categoryName]) {
      questionsByCategory[q.categoryName] = [];
    }
    questionsByCategory[q.categoryName].push(q);
  });

  const serviceQuestionsByService: QuestionsByCategory = {};
  serviceQuestions.forEach((q) => {
    const key = q.serviceName || 'Service';
    if (!serviceQuestionsByService[key]) {
      serviceQuestionsByService[key] = [];
    }
    serviceQuestionsByService[key].push(q);
  });

  const totalRequired = allRequirements.filter((r) => r.isRequired).length + allQuestions.filter((q) => q.isRequired).length;
  const completedRequired = allRequirements.filter((r) => {
    if (!r.isRequired) return false;
    if (r.type === 'attestation') {
      return Boolean(attestationResponses[r.id]);
    }
    return Boolean(r.submissionStatus && r.submissionStatus !== 'not_submitted');
  }).length +
    allQuestions.filter((q) => q.isRequired && questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== null && questionAnswers[q.id] !== '').length;
  const progressPercent = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  const allRequiredAnswered =
    allRequirements.every((r) => !r.isRequired || (r.type === 'attestation' ? Boolean(attestationResponses[r.id]) : Boolean(r.submissionStatus && r.submissionStatus !== 'not_submitted'))) &&
    allQuestions.every((q) => !q.isRequired || (questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== null && questionAnswers[q.id] !== ''));

  const canSubmit = allRequiredAnswered && totalRequired > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const attestations = allRequirements
      .filter((r) => r.type === 'attestation' && attestationResponses[r.id])
      .map((r) => ({
        ...(r.scope === 'service' ? { serviceRequirementId: r.id } : { requirementId: r.id }),
        answer: attestationResponses[r.id],
      }));

    const questionPayload = allQuestions
      .filter((q) => questionAnswers[q.id] !== undefined && questionAnswers[q.id] !== null && questionAnswers[q.id] !== '')
      .map((q) => ({
        ...(q.scope === 'service' ? { serviceQuestionId: q.id } : { questionId: q.id }),
        answer: Array.isArray(questionAnswers[q.id]) ? (questionAnswers[q.id] as string[]).join(',') : (questionAnswers[q.id] as string),
      }));

    const res = await submitAttestations({ attestations, questions: questionPayload }, serviceId);

    if (res?.status === 200 && serviceId) {
      const reviewRes = await submitServiceForReview(serviceId);
      if (reviewRes?.status === 200) {
        setSubmitSuccess('Requirements submitted for review successfully.');
      } else {
        setSubmitSuccess('Answers saved. Could not submit this service for review yet.');
      }
      fetchData();
    } else if (res?.status === 200) {
      setSubmitSuccess('Requirements submitted successfully.');
      fetchData();
    } else {
      setSubmitError('Failed to submit requirements. Please try again.');
    }
    setSubmitting(false);
  };

  const handleFileChange = async (
    req: VettingRequirement,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadStates((prev) => ({ ...prev, [req.id]: { uploading: true, error: null, success: null } }));

    const allowedTypes = (req.acceptedMimeTypes?.length ? req.acceptedMimeTypes : ['image/jpeg', 'image/png', 'image/webp']);
    const maxSize = (req.maxFileSizeMb ? req.maxFileSizeMb : 5) * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setUploadStates((prev) => ({
        ...prev,
        [req.id]: { uploading: false, error: `Invalid file type "${file.type}". Allowed: ${allowedTypes.join(', ')}`, success: null },
      }));
      return;
    }
    if (file.size > maxSize) {
      setUploadStates((prev) => ({
        ...prev,
        [req.id]: { uploading: false, error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds ${req.maxFileSizeMb || 5}MB limit`, success: null },
      }));
      return;
    }

    try {
      const urlRes = await requestDocumentUploadUrls([
        {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          category: req.type === 'certification' ? 'certification' : 'requirement_document',
          ...(req.scope === 'service' ? { serviceRequirementId: req.id } : { requirementId: req.id }),
        },
      ]);

      if (urlRes?.status !== 200 || !urlRes.data?.data?.[0]) {
        const message =
          typeof urlRes?.data === 'object' && urlRes?.data && 'message' in urlRes.data
            ? String((urlRes.data as { message: string }).message)
            : 'Failed to prepare upload.';
        setUploadStates((prev) => ({ ...prev, [req.id]: { uploading: false, error: message, success: null } }));
        return;
      }

      const item = urlRes.data.data[0];

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', item.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      const confirmRes = await confirmDocumentUploads([item.id]);
      if (confirmRes?.status === 200) {
        setUploadStates((prev) => ({
          ...prev,
          [req.id]: { uploading: false, error: null, success: `${req.name} uploaded and submitted for review.` },
        }));
        fetchData();
      } else {
        setUploadStates((prev) => ({
          ...prev,
          [req.id]: { uploading: false, error: 'File uploaded but failed to submit for review.', success: null },
        }));
        fetchData();
      }
    } catch {
      setUploadStates((prev) => ({
        ...prev,
        [req.id]: { uploading: false, error: 'An unexpected error occurred while uploading.', success: null },
      }));
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'submitted': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'submitted': return 'Submitted';
      default: return 'Not Submitted';
    }
  };

  const getEffectiveStatus = (req: VettingRequirement): string | null => {
    if (req.type !== 'attestation') return req.submissionStatus;
    if (!req.attestationId) return null;
    if (providerVerificationStatus === 'approved') return 'approved';
    if (providerVerificationStatus === 'rejected') return 'rejected';
    return 'submitted';
  };

  const openPreview = async (doc: { id: string; mimeType: string | null; fileName: string | null }) => {
    setPreviewDocument(doc);
    setPreviewLoading(true);
    const res = await getDocumentDownloadUrl(doc.id);
    if (res?.status === 200 && res.data.data?.url) {
      setPreviewUrl(res.data.data.url);
    } else {
      setPreviewUrl(null);
    }
    setPreviewLoading(false);
  };

  const closePreview = () => {
    setPreviewDocument(null);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        Requirements & Questionnaire
      </Typography>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess(null)}>
          {submitSuccess}
        </Alert>
      )}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 10, borderRadius: 1 }} />
            </Box>
            <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>
              {completedRequired} of {totalRequired} required items
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {Object.entries(requirementsByCategory).map(([categoryName, categoryReqs]) => (
        <Card key={categoryName} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {categoryName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Category requirements
            </Typography>
            {categoryReqs.map((req) => (
              <RequirementRow
                key={req.id}
                req={req}
                fileInputRef={fileInputRef}
                uploadStates={uploadStates}
                attestationResponses={attestationResponses}
                setAttestationResponses={setAttestationResponses}
                getEffectiveStatus={getEffectiveStatus}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                openPreview={openPreview}
                handleFileChange={handleFileChange}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {Object.entries(serviceRequirementsByService).map(([serviceName, sReqs]) => (
        <Card key={`sr-${serviceName}`} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {serviceName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Service-specific requirements
            </Typography>
            {sReqs.map((req) => (
              <RequirementRow
                key={req.id}
                req={req}
                fileInputRef={fileInputRef}
                uploadStates={uploadStates}
                attestationResponses={attestationResponses}
                setAttestationResponses={setAttestationResponses}
                getEffectiveStatus={getEffectiveStatus}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                openPreview={openPreview}
                handleFileChange={handleFileChange}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {Object.entries(questionsByCategory).map(([categoryName, categoryQuestions]) => (
        <Card key={`q-${categoryName}`} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {categoryName} - Questions
            </Typography>
            {categoryQuestions.map((q) => (
              <QuestionRow key={q.id} q={q} questionAnswers={questionAnswers} setQuestionAnswers={setQuestionAnswers} />
            ))}
          </CardContent>
        </Card>
      ))}

      {Object.entries(serviceQuestionsByService).map(([serviceName, sQuestions]) => (
        <Card key={`sq-${serviceName}`} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {serviceName} - Questions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Service-specific questions
            </Typography>
            {sQuestions.map((q) => (
              <QuestionRow key={q.id} q={q} questionAnswers={questionAnswers} setQuestionAnswers={setQuestionAnswers} />
            ))}
          </CardContent>
        </Card>
      ))}

      {allRequirements.length > 0 || allQuestions.length > 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </Box>
      ) : (
        <Alert severity="info">
          No requirements or questions found for your service categories.
        </Alert>
      )}

      {previewDocument && (
        <Dialog
          open
          onClose={closePreview}
          maxWidth="md"
          fullWidth
          slotProps={{ paper: { sx: { backgroundColor: '#111' } } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              {previewDocument.fileName || 'Document'}
            </Typography>
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogTitle>
          <DialogContent sx={{ position: 'relative', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewLoading && <CircularProgress sx={{ color: 'text.primary' }} />}
            {!previewLoading && previewUrl && (
              previewDocument.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  title={previewDocument.fileName || 'Document'}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 4 }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewDocument.fileName || 'Document'}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
                />
              )
            )}
            {!previewLoading && !previewUrl && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <ImageNotSupportedIcon />
                <Typography variant="body2">Unable to load this document.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
            <Button onClick={closePreview} color="inherit" size="small">Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

interface RequirementRowProps {
  req: VettingRequirement;
  fileInputRef: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  uploadStates: Record<string, UploadState>;
  attestationResponses: Record<string, string>;
  setAttestationResponses: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getEffectiveStatus: (req: VettingRequirement) => string | null;
  getStatusColor: (status: string | null) => string;
  getStatusLabel: (status: string | null) => string;
  openPreview: (doc: { id: string; mimeType: string | null; fileName: string | null }) => void;
  handleFileChange: (req: VettingRequirement, event: React.ChangeEvent<HTMLInputElement>) => void;
}

function RequirementRow({
  req,
  fileInputRef,
  uploadStates,
  attestationResponses,
  setAttestationResponses,
  getEffectiveStatus,
  getStatusColor,
  getStatusLabel,
  openPreview,
  handleFileChange,
}: RequirementRowProps) {
  const uploadState = uploadStates[req.id];
  const isFileType = req.type === 'document' || req.type === 'certification';
  const hasUploadedDoc = Boolean(req.submissionStatus && req.submissionStatus !== 'not_submitted');
  const effectiveStatus = getEffectiveStatus(req);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1">{req.name}</Typography>
          <Chip label={req.type} size="small" variant="outlined" />
          {req.isRequired && <Chip label="Required" size="small" color="primary" variant="outlined" />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label={getStatusLabel(effectiveStatus)}
            size="small"
            color={getStatusColor(effectiveStatus) as 'success' | 'error' | 'warning' | 'default'}
            icon={
              effectiveStatus === 'approved' ? <CheckCircleIcon /> :
              effectiveStatus === 'rejected' ? <ErrorIcon /> :
              effectiveStatus === 'submitted' ? <HourglassEmptyIcon /> :
              undefined
            }
          />
          {effectiveStatus === 'rejected' && req.rejectionReason && (
            <Typography variant="caption" color="error">
              {req.rejectionReason}
            </Typography>
          )}
          {uploadState?.error && (
            <Typography variant="caption" color="error">{uploadState.error}</Typography>
          )}
          {uploadState?.success && (
            <Typography variant="caption" color="success.main">{uploadState.success}</Typography>
          )}
          {isFileType && req.documentId && (
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={() => openPreview({ id: req.documentId!, mimeType: req.mimeType, fileName: req.fileName })}
            >
              View
            </Button>
          )}
        </Box>
      </Box>
      <Box>
        {req.type === 'attestation' && (
          <RadioGroup
            row
            value={attestationResponses[req.id] || ''}
            onChange={(e) => setAttestationResponses((prev) => ({ ...prev, [req.id]: e.target.value }))}
          >
            <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
            <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
          </RadioGroup>
        )}
        {isFileType && (
          <>
            <input
              ref={(el) => { fileInputRef.current[req.id] = el; }}
              type="file"
              accept={(req.acceptedMimeTypes?.length ? req.acceptedMimeTypes : ['image/jpeg', 'image/png', 'image/webp']).join(',')}
              hidden
              onChange={(e) => handleFileChange(req, e)}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={uploadState?.uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
              disabled={uploadState?.uploading}
              onClick={() => fileInputRef.current[req.id]?.click()}
            >
              {uploadState?.uploading
                ? 'Uploading...'
                : hasUploadedDoc
                  ? 'Replace'
                  : 'Upload'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

interface QuestionRowProps {
  q: VettingQuestion;
  questionAnswers: Record<string, string | string[]>;
  setQuestionAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
}

function QuestionRow({ q, questionAnswers, setQuestionAnswers }: QuestionRowProps) {
  return (
    <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          {q.question}
          {q.isRequired && <Chip label="Required" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />}
        </FormLabel>
        {q.type === 'yes_no' && (
          <RadioGroup
            row
            value={questionAnswers[q.id] || ''}
            onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          >
            <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
            <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
          </RadioGroup>
        )}
        {q.type === 'text' && (
          <TextField
            size="small"
            fullWidth
            value={questionAnswers[q.id] || ''}
            onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          />
        )}
        {q.type === 'single_choice' && (
          <RadioGroup
            value={questionAnswers[q.id] || ''}
            onChange={(e) => setQuestionAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          >
            {q.options.map((opt) => (
              <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
            ))}
          </RadioGroup>
        )}
        {q.type === 'multiple_choice' && (
          <FormGroup>
            {q.options.map((opt) => {
              const current = Array.isArray(questionAnswers[q.id]) ? (questionAnswers[q.id] as string[]) : [];
              return (
                <FormControlLabel
                  key={opt}
                  control={
                    <Checkbox
                      size="small"
                      checked={current.includes(opt)}
                      onChange={(e) => {
                        setQuestionAnswers((prev) => {
                          const prevArr = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];
                          if (e.target.checked) {
                            prevArr.push(opt);
                          } else {
                            const idx = prevArr.indexOf(opt);
                            if (idx > -1) prevArr.splice(idx, 1);
                          }
                          return { ...prev, [q.id]: prevArr };
                        });
                      }}
                    />
                  }
                  label={opt}
                />
              );
            })}
          </FormGroup>
        )}
      </FormControl>
    </Box>
  );
}