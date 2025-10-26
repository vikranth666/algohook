import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { eventsAPI } from '@/services/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Calendar, Search, Plus, Eye, RefreshCw, Filter } from 'lucide-react';

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

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Create Event Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'candidate.created',
    payload: '{\n  "id": "123",\n  "name": "John Doe"\n}',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadEvents();
    loadStats();
    const interval = setInterval(() => {
      loadEvents();
      loadStats();
    }, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedType, events]);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ limit: 100 });
      setEvents(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load events:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await eventsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((event) => event.type === selectedType);
    }

    setFilteredEvents(filtered);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      // Validate JSON payload
      const parsedPayload = JSON.parse(formData.payload);

      await eventsAPI.create({
        name: formData.name,
        type: formData.type,
        payload: parsedPayload,
      });

      setCreateDialogOpen(false);
      setFormData({
        name: '',
        type: 'candidate.created',
        payload: '{\n  "id": "123",\n  "name": "John Doe"\n}',
      });
      loadEvents();
      loadStats();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setCreateError('Invalid JSON payload. Please check your syntax.');
      } else {
        setCreateError(error.response?.data?.error || 'Failed to create event');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const getEventTypeColor = (type) => {
    if (type.includes('created')) return 'bg-green-100 text-green-800';
    if (type.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (type.includes('deleted')) return 'bg-red-100 text-red-800';
    if (type.includes('scheduled')) return 'bg-purple-100 text-purple-800';
    if (type.includes('completed')) return 'bg-emerald-100 text-emerald-800';
    if (type.includes('cancelled')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Calendar className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">Track all system events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEvents}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_events || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_deliveries || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unique Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_event_types || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Deliveries/Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_deliveries_per_event
                  ? parseFloat(stats.avg_deliveries_per_event).toFixed(1)
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Event Types</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
            {(searchQuery || selectedType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{event.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {formatRelativeTime(event.created_at)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Type Badge */}
              <div>
                <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event ID:</span>
                  <span className="font-mono text-xs">{event.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliveries:</span>
                  <span className="font-semibold">{event.delivery_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(event.created_at)}</span>
                </div>
              </div>

              {/* View Details Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleViewDetails(event)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || selectedType !== 'all'
                  ? 'No events found'
                  : 'No events yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'}
              </p>
              {!searchQuery && selectedType === 'all' && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEvent.name}</DialogTitle>
              <DialogDescription>Event details and payload</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Event Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <Badge className={`mt-1 ${getEventTypeColor(selectedEvent.type)}`}>
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <Label>Event ID</Label>
                  <p className="mt-1 text-sm font-mono">{selectedEvent.id}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedEvent.created_at)}</p>
                </div>
                <div>
                  <Label>Deliveries</Label>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedEvent.delivery_count || 0}
                  </p>
                </div>
              </div>

              {/* Payload */}
              <div>
                <Label>Event Payload</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Event</DialogTitle>
            <DialogDescription>
              Trigger a test event to test your webhook integrations
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                placeholder="New Candidate Application"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type *</Label>
              <select
                id="event-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-payload">Event Payload (JSON) *</Label>
              <textarea
                id="event-payload"
                value={formData.payload}
                onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                rows={10}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Must be valid JSON format
              </p>
            </div>

            {createError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {createError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setCreateError('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}