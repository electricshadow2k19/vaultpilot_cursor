import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  Key,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  credentialName: string;
  credentialType: string;
  user: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  ipAddress: string;
}

const Audit: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    // Mock audit data
    setAuditLogs([
      {
        id: '1',
        timestamp: '2024-01-20T10:30:00Z',
        action: 'Credential Rotation',
        credentialName: 'Production DB Password',
        credentialType: 'Database',
        user: 'admin@company.com',
        status: 'success',
        details: 'Successfully rotated database password for production environment',
        ipAddress: '192.168.1.100'
      },
      {
        id: '2',
        timestamp: '2024-01-20T09:15:00Z',
        action: 'Credential Access',
        credentialName: 'AWS Access Key',
        credentialType: 'AWS IAM',
        user: 'dev@company.com',
        status: 'success',
        details: 'Retrieved AWS access key for deployment process',
        ipAddress: '192.168.1.101'
      },
      {
        id: '3',
        timestamp: '2024-01-19T16:45:00Z',
        action: 'Credential Rotation',
        credentialName: 'SMTP Credentials',
        credentialType: 'SMTP',
        user: 'admin@company.com',
        status: 'failed',
        details: 'Failed to rotate SMTP credentials - service unavailable',
        ipAddress: '192.168.1.100'
      },
      {
        id: '4',
        timestamp: '2024-01-19T14:20:00Z',
        action: 'Credential Discovery',
        credentialName: 'GitHub Token',
        credentialType: 'GitHub',
        user: 'system',
        status: 'warning',
        details: 'Discovered expired GitHub token in CI/CD pipeline',
        ipAddress: 'system'
      },
      {
        id: '5',
        timestamp: '2024-01-19T11:30:00Z',
        action: 'Credential Rotation',
        credentialName: 'API Token',
        credentialType: 'API Token',
        user: 'admin@company.com',
        status: 'success',
        details: 'Successfully rotated API token for external service integration',
        ipAddress: '192.168.1.100'
      }
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.credentialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesAction && matchesStatus;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'Credential', 'Type', 'User', 'Status', 'Details', 'IP Address'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.action,
        log.credentialName,
        log.credentialType,
        log.user,
        log.status,
        log.details,
        log.ipAddress
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">Monitor all credential-related activities and security events</p>
        </div>
        <button
          onClick={exportLogs}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="Credential Rotation">Credential Rotation</option>
              <option value="Credential Access">Credential Access</option>
              <option value="Credential Discovery">Credential Discovery</option>
              <option value="Credential Creation">Credential Creation</option>
              <option value="Credential Deletion">Credential Deletion</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credential
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.credentialName}</div>
                      <div className="text-sm text-gray-500">{log.credentialType}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(log.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">IP: {log.ipAddress}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterAction !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Audit logs will appear here as activities occur.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;
