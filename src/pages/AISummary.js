import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, TrendingUp, Target, AlertCircle, CheckCircle,
  RefreshCw, Clock, Trash2,
} from 'lucide-react';

const sentimentConfig = {
  positive: {
    bg: 'bg-teal-100',
    icon: <CheckCircle className="text-teal-600" size={20} />,
  },
  warning: {
    bg: 'bg-orange-100',
    icon: <AlertCircle className="text-orange-500" size={20} />,
  },
  neutral: {
    bg: 'bg-blue-100',
    icon: <Sparkles className="text-blue-600" size={20} />,
  },
};

function InsightCard({ title, text, detail, sentiment }) {
  const cfg = sentimentConfig[sentiment] || sentimentConfig.neutral;
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className={`w-10 h-10 ${cfg.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
        {cfg.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-700">{text}</p>
        {detail && <p className="text-sm text-gray-500 mt-2">{detail}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-3/4 mt-2" />
      </div>
    </div>
  );
}

function SectionSkeleton({ count = 2 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

const CACHE_KEY = 'ai_insights_cache';
const STALE_KEY = 'ai_insights_stale';
const CACHE_VERSION = 'v2'; // bump this to auto-invalidate old cached data

const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(STALE_KEY);
};

const AISummary = () => {
  const [insights, setInsights] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const res = await fetch('/api/ai-insights');
      if (!res.ok) {
        const err = await res.json();
        throw { message: err.error || 'Failed to fetch insights', detail: err.details };
      }
      const json = await res.json();
      setInsights(json.insights);
      setMeta(json.meta);
      // Cache the result with version tag
      localStorage.setItem(CACHE_KEY, JSON.stringify({ v: CACHE_VERSION, insights: json.insights, meta: json.meta }));
      localStorage.removeItem(STALE_KEY);
    } catch (err) {
      setError(err.message || String(err));
      setErrorDetail(err.detail || null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearCache = useCallback(() => {
    clearCache();
    setInsights(null);
    setMeta(null);
    setError(null);
    setErrorDetail(null);
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    const raw = localStorage.getItem(CACHE_KEY);
    const isStale = localStorage.getItem(STALE_KEY) === 'true';

    if (raw && !isStale) {
      const cached = JSON.parse(raw);
      // If cache version matches, use it — otherwise treat as stale
      if (cached.v === CACHE_VERSION) {
        setInsights(cached.insights);
        setMeta(cached.meta);
        return;
      }
    }
    // No valid cache or stale — fetch fresh
    clearCache();
    fetchInsights();
  }, [fetchInsights]);

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Summary</h1>
            <p className="text-gray-500">Real-time insights powered by GPT-4o</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {meta?.generatedAt && !loading && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              Generated at {formatTime(meta.generatedAt)}
            </span>
          )}
          <button
            onClick={handleClearCache}
            disabled={loading}
            title="Clear cached insights and regenerate fresh from your current data"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Trash2 size={14} />
            Clear Cache
          </button>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-800">Could not generate insights</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            {errorDetail && (
              <p className="text-red-500 text-xs mt-1 font-mono break-all">{errorDetail}</p>
            )}
            <button
              onClick={fetchInsights}
              className="mt-3 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Wealth Overview Insights */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-teal-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Wealth Overview Insights</h2>
        </div>
        {loading ? (
          <SectionSkeleton count={2} />
        ) : (
          <div className="space-y-4">
            {insights?.wealthInsights?.map((item, i) => (
              <InsightCard key={i} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* Savings & Income Analysis */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Savings &amp; Income Analysis</h2>
        </div>
        {loading ? (
          <SectionSkeleton count={2} />
        ) : (
          <div className="space-y-4">
            {insights?.savingsInsights?.map((item, i) => (
              <InsightCard key={i} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* Goals Progress */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Target className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Goals Progress</h2>
        </div>
        {loading ? (
          <SectionSkeleton count={2} />
        ) : (
          <div className="space-y-4">
            {insights?.goalsInsights?.map((item, i) => (
              <InsightCard key={i} {...item} />
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 border border-teal-100">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-teal-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
        </div>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-teal-300 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-teal-100 rounded w-1/4" />
                  <div className="h-3 bg-teal-100 rounded w-full" />
                  <div className="h-3 bg-teal-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {insights?.recommendations?.map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
                <p className="text-gray-700">
                  <span className="font-semibold">{rec.heading}: </span>
                  {rec.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISummary;
