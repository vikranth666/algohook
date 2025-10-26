import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { webhooksAPI } from '@/services/api';
import { X, Copy, CheckCircle2 } from 'lucide-react';

const EVENT_TYPES = [
  'job.created',
  'job.updated',
  'job.deleted',
  'candidate.created',
  'candidate.updated',
  'candidate.status_changed',
  'interview.scheduled',
  'interview.completed',
  'interview.cancelled',
  'assessment.submitted',
  'assessment.graded',
];

export default function CreateWebhookDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    eventTypes: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.eventTypes.length === 0) {
      setError('Please select at least one event type');
      setLoading(false);
      return;
    }

    try {
      const response = await webhooksAPI.create(formData);
      setSecretKey(response.data.secretKey);
      setShowSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create webhook');
      setLoading(false);
    }
  };

  const toggleEventType = (eventType) => {
    setFormData((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((t) => t !== eventType)
        : [...prev.eventTypes, eventType],
    }));
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFormData({ name: '', url: '', eventTypes: [] });
    setError('');
    setSecretKey('');
    setShowSuccess(false);
    setCopied(false);
    setLoading(false);
    onOpenChange(false);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Webhook Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Save your secret key securely. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <Label>Secret Key</Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-2 bg-background rounded border text-sm break-all">
                  {secretKey}
                </code>
                <Button size="sm" variant="outline" onClick={copySecretKey}>
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use this key to verify webhook signatures
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Webhook</DialogTitle>
          <DialogDescription>
            Subscribe to events and receive real-time notifications
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Webhook Name *</Label>
            <Input
              id="name"
              placeholder="My HRMS Integration"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Endpoint URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/webhooks"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be a valid HTTPS URL
            </p>
          </div>

          <div className="space-y-2">
            <Label>Event Types *</Label>
            <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
              {EVENT_TYPES.map((eventType) => (
                <div
                  key={eventType}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    formData.eventTypes.includes(eventType)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => toggleEventType(eventType)}
                >
                  <p className="text-sm font-medium">{eventType}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {formData.eventTypes.length} event types
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}