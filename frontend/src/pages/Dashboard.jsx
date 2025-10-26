import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI } from '@/services/api';
import { Activity, Webhook, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { formatRelativeTime, getStatusColor } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewRes, deliveriesRes, healthRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getRecentDeliveries(50),
        dashboardAPI.getHealth(),
      ]);
      
      setOverview(overviewRes.data.data);
      setRecentDeliveries(deliveriesRes.data.data);
      setHealth(healthRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Deliveries',
      value: overview?.deliveries?.total_deliveries || 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Successful',
      value: overview?.deliveries?.successful || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Failed',
      value: overview?.deliveries?.failed || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Active Webhooks',
      value: overview?.activeWebhooksCount || 0,
      icon: Webhook,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const successRate = overview?.deliveries?.total_deliveries > 0
    ? ((overview.deliveries.successful / overview.deliveries.total_deliveries) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your webhook delivery system</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={health?.status === 'healthy' ? 'success' : 'error'}>
            {health?.status === 'healthy' ? 'System Healthy' : 'System Issues'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.title === 'Successful' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {successRate}% success rate
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Performance</CardTitle>
          <CardDescription>Success rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 mb-2" />
            <p className="ml-2">Chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Latest webhook delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDeliveries.slice(0, 10).map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{delivery.webhook_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {delivery.event_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {delivery.webhook_url}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status}
                    </Badge>
                    {delivery.attempt_number > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Attempt {delivery.attempt_number}
                      </p>
                    )}
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(delivery.created_at)}
                    </p>
                    {delivery.response_code && (
                      <p className="text-xs text-muted-foreground">
                        HTTP {delivery.response_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {recentDeliveries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No deliveries yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
