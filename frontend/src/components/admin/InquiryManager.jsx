import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Tag,
  User
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  new: { label: 'New', color: 'bg-rose-100 text-rose-700', icon: Inbox },
  reviewing: { label: 'Reviewing', color: 'bg-blue-100 text-blue-700', icon: Clock },
  quoted: { label: 'Quoted', color: 'bg-violet-100 text-violet-700', icon: FileText },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-600', icon: CheckCircle }
};

const inquiryTypeConfig = {
  custom_quote: {
    label: 'Custom Quote',
    color: 'bg-cyan-100 text-cyan-700',
    icon: FileText
  },
  contact: {
    label: 'General Question',
    color: 'bg-emerald-100 text-emerald-700',
    icon: MessageSquare
  }
};

const formatDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getCustomerName = (inquiry) => inquiry.full_name || inquiry.name || 'Customer';
const getMessage = (inquiry) => inquiry.project_details || inquiry.collaboration_idea || '';

const DetailRow = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  const isLink = typeof displayValue === 'string' && /^https?:\/\//i.test(displayValue);

  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {isLink ? (
        <a href={displayValue} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-blue-600 break-words hover:underline">
          {displayValue}
        </a>
      ) : (
        <p className="mt-1 text-sm text-slate-700 break-words">{displayValue}</p>
      )}
    </div>
  );
};

const InquiryCard = ({ inquiry, onStatusChange }) => {
  const status = statusConfig[inquiry.status] || statusConfig.new;
  const StatusIcon = status.icon;
  const type = inquiryTypeConfig[inquiry.inquiry_type] || inquiryTypeConfig.contact;
  const TypeIcon = type.icon;
  const name = getCustomerName(inquiry);
  const message = getMessage(inquiry);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white flex-shrink-0">
            <TypeIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800 break-words">{name}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${type.color}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {type.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(inquiry.created_at)}
              </span>
              {inquiry.email && (
                <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Mail className="h-4 w-4" />
                  {inquiry.email}
                </a>
              )}
              {inquiry.phone && (
                <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Phone className="h-4 w-4" />
                  {inquiry.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:justify-end">
          <label className="text-sm font-medium text-slate-500" htmlFor={`status-${inquiry.inquiry_type}-${inquiry.id}`}>
            Status
          </label>
          <select
            id={`status-${inquiry.inquiry_type}-${inquiry.id}`}
            value={inquiry.status || 'new'}
            onChange={(event) => onStatusChange(inquiry, event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <DetailRow label="Use" value={inquiry.use_type} />
        <DetailRow label="Product" value={inquiry.product_name || inquiry.creation_type} />
        <DetailRow label="NFC / QR Link" value={inquiry.nfc_link} />
        <DetailRow label="Personalization" value={inquiry.personalization} />
        <DetailRow label="Quantity" value={inquiry.quantity_needed} />
        <DetailRow label="Color" value={inquiry.preferred_colors} />
        <DetailRow label="Finish" value={inquiry.preferred_finish} />
        <DetailRow label="Size" value={inquiry.size_needed} />
        <DetailRow label="Need By" value={inquiry.need_by_date} />
        <DetailRow label="Budget" value={inquiry.budget_range} />
        <DetailRow label="Delivery" value={inquiry.delivery_method} />
        <DetailRow label="Delivery Fee" value={inquiry.delivery_fee ? `$${Number(inquiry.delivery_fee).toFixed(2)}` : ''} />
        <DetailRow label="Special Ideas" value={inquiry.special_ideas} />
        <DetailRow label="Attachment" value={inquiry.attachment_image_url} />
        <DetailRow label="Instagram" value={inquiry.instagram} />
        <DetailRow label="TikTok" value={inquiry.tiktok} />
        <DetailRow label="Website" value={inquiry.website} />
      </div>
    </motion.article>
  );
};

export const InquiryManager = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(() => fetchInquiries({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchInquiries = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setRefreshing(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/inquiries`, {
        withCredentials: true
      });
      setInquiries(response.data || []);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      if (!quiet) toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (inquiry, nextStatus) => {
    const previousInquiries = inquiries;
    setInquiries((current) =>
      current.map((item) =>
        item.id === inquiry.id && item.inquiry_type === inquiry.inquiry_type
          ? { ...item, status: nextStatus }
          : item
      )
    );

    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/inquiries/${inquiry.inquiry_type}/${inquiry.id}/status`,
        { status: nextStatus },
        { withCredentials: true }
      );
      toast.success('Inquiry updated');
    } catch (error) {
      console.error('Failed to update inquiry:', error);
      setInquiries(previousInquiries);
      toast.error('Could not update inquiry');
    }
  };

  const filteredInquiries = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return inquiries.filter((inquiry) => {
      const matchesType = typeFilter === 'all' || inquiry.inquiry_type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? inquiry.status !== 'archived' : inquiry.status === statusFilter);
      const haystack = [
        getCustomerName(inquiry),
        inquiry.email,
        inquiry.phone,
        inquiry.creation_type,
        inquiry.use_type,
        getMessage(inquiry)
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesType && matchesStatus && (!search || haystack.includes(search));
    });
  }, [inquiries, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const active = inquiries.filter((inquiry) => inquiry.status !== 'archived');
    return {
      total: inquiries.length,
      new: inquiries.filter((inquiry) => inquiry.status === 'new').length,
      quotes: inquiries.filter((inquiry) => inquiry.inquiry_type === 'custom_quote').length,
      contact: inquiries.filter((inquiry) => inquiry.inquiry_type === 'contact').length,
      active: active.length
    };
  }, [inquiries]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-44 rounded-lg bg-slate-200 animate-pulse" />
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
            <div className="h-5 w-56 bg-slate-200 rounded mb-4" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Inquiries</h1>
          <p className="text-slate-500">
            Quote requests, custom design requests, and general website questions.
          </p>
        </div>
        <button
          onClick={() => fetchInquiries()}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-3">
              <Inbox className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">New</p>
              <p className="text-2xl font-bold text-slate-800">{stats.new}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Custom Quotes</p>
              <p className="text-2xl font-bold text-slate-800">{stats.quotes}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">General Questions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.contact}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3">
              <Tag className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, message, or request type..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Types</option>
          <option value="custom_quote">Custom Quotes</option>
          <option value="contact">General Questions</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="active">Active Only</option>
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      </div>

      {filteredInquiries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-100 p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800">
            {inquiries.length ? 'No matching inquiries' : 'No inquiries yet'}
          </h3>
          <p className="text-slate-500">
            {inquiries.length
              ? 'Try changing the filters or search term.'
              : 'New quote requests and contact messages will appear here automatically.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredInquiries.map((inquiry) => (
              <InquiryCard
                key={`${inquiry.inquiry_type}-${inquiry.id}`}
                inquiry={inquiry}
                onStatusChange={handleStatusChange}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
