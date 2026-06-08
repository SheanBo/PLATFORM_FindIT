import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function MyStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/findit-dashboard/my-stats')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const totalReports = stats?.my_reports?.reduce((s, r) => s + r.cnt, 0) || 0;
  const totalMatches = stats?.my_matches?.cnt || 0;
  const totalClaims = stats?.my_claims?.reduce((s, c) => s + c.cnt, 0) || 0;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    link,
    description,
  }) => (
    <Link
      to={link}
      className="card card-interactive hover:border-amber-400 flex flex-col"
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${color} mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-4xl font-bold text-amber-950 mb-1">{value}</p>
      <p className="text-sm font-medium text-amber-700 mb-2">{label}</p>
      {description && (
        <p className="text-xs text-amber-600 mb-3">{description}</p>
      )}
      <div className="mt-auto flex items-center text-amber-600 text-sm font-semibold">
        View Details <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 sticky top-0 z-40">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-950 mb-1">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-amber-700">Here's your FindIT overview</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FileText}
            label="Lost Reports"
            value={totalReports}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
            link="/lost-reports"
            description="Reports you filed"
          />
          <StatCard
            icon={Zap}
            label="Potential Matches"
            value={totalMatches}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
            link="/matching"
            description="Items that might be yours"
          />
          <StatCard
            icon={CheckCircle}
            label="My Claims"
            value={totalClaims}
            color="bg-gradient-to-br from-green-600 to-green-700"
            link="/claims"
            description="Items you claimed"
          />
        </div>

      </div>
    </div>
  );
}
