import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { webhooksAPI } from '@/services/api';
import { formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import { RefreshCw, BarChart3, List } from 'lucide-react';

export default function WebhookDetailsDialog({ open, onOpenChange, webhook }) {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && webhook) {
      loadData();
    }
  }, [open, webhook]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deliveriesRes, statsRes] = await Promise.all([
        webhooksAPI.getDeliveries(webhook.id, { limit: 50 }),
        webhooksAPI.getStats(webhook.id),
      ]);
      setDeliveries(deliveriesRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to load webhook details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (eventId) => {
    try {
      await webhooksAPI.retry(webhook.id, eventId);
      loadData();
    } catch (error) {
      console.error('Failed to retry delivery:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{webhook.name}</DialogTitle>
          <DialogDescription className="break-all">
            {webhook.url}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries">
              <List className="h-4 w-4 mr-2" />
              Deliveries
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Recent delivery attempts
              </p>
              <Button size="sm" variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{delivery.event_type}</Badge>
                          <Badge className={getStatusColor(delivery.status)}>
                            {delivery.status}
                          </Badge>
                          {delivery.response_code && (
                            <Badge variant="secondary">
                              HTTP {delivery.response_code}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Event: {delivery.event_name}
                        </p>
                        {delivery.error_message && (
                          <p className="text-sm text-destructive mt-2">
                            {delivery.error_message}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {formatRelativeTime(delivery.created_at)}
                        </p>
                        {delivery.attempt_number > 1 && (
                          <Badge variant="outline" className="text-xs">
                            Attempt {delivery.attempt_number}
                          </Badge>
                        )}
                        {delivery.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(delivery.event_id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {deliveries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No deliveries yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Deliveries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {stats.total_deliveries || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.total_deliveries > 0
                        ? (
                            (stats.successful / stats.total_deliveries) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Successful</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.successful || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.failed || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.pending || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Avg Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {stats.avg_attempts
                        ? parseFloat(stats.avg_attempts).toFixed(2)
                        : 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}