import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { eventsAPI } from '@/services/api';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Search, RefreshCw, Calendar } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [selectedType]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'all' ? { eventType: selectedType } : {};
      const response = await eventsAPI.getAll(params);
      setEvents(response.data.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [...new Set(events.map(e => e.event_type))];
  
  const filteredEvents = events.filter(event =>
    event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">View all system events</p>
        </div>
        <Button onClick={loadEvents} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('all')}
          >
            All
          </Button>
          {eventTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.event_type}</Badge>
                    {event.processed_at ? (
                      <Badge variant="success">Processed</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold">{event.event_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Source: {event.source}
                  </p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary hover:underline">
                      View Payload
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(
                        typeof event.payload === 'string'
                          ? JSON.parse(event.payload)
                          : event.payload,
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </div>
                <div className="text-right space-y-1 ml-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatRelativeTime(event.created_at)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.created_at)}
                  </p>
                  {event.processed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processed: {formatRelativeTime(event.processed_at)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredEvents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'Try adjusting your search filters'
                    : 'Events will appear here once created'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
