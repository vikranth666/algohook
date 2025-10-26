import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { webhooksAPI } from '@/services/api';
import { Plus, Trash2, Edit, ExternalLink, BarChart } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import CreateWebhookDialog from '@/components/CreateWebhookDialog';
import WebhookDetailsDialog from '@/components/WebhookDetailsDialog';

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await webhooksAPI.getAll();
      setWebhooks(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      setLoading(false);
    }
  };

  const handleToggle = async (webhook) => {
    try {
      await webhooksAPI.toggle(webhook.id, !webhook.is_active);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await webhooksAPI.delete(id);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleViewDetails = (webhook) => {
    setSelectedWebhook(webhook);
    setDetailsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading webhooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Manage your webhook subscriptions</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Webhook
        </Button>
      </div>

      {/* Webhooks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{webhook.name}</CardTitle>
                  <CardDescription className="mt-1 break-all">
                    {webhook.url}
                  </CardDescription>
                </div>
                <Switch
                  checked={webhook.is_active}
                  onCheckedChange={() => handleToggle(webhook)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Types */}
              <div>
                <p className="text-sm font-medium mb-2">Subscribed Events</p>
                <div className="flex flex-wrap gap-1">
                  {webhook.event_types.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {formatDate(webhook.created_at)}</p>
                <p>Updated: {formatDate(webhook.updated_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewDetails(webhook)}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(webhook.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(webhook.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by registering your first webhook
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Register Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateWebhookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadWebhooks}
      />
      
      {selectedWebhook && (
        <WebhookDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          webhook={selectedWebhook}
        />
      )}
    </div>
  );
}