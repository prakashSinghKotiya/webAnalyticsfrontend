import { useState, useEffect, useCallback, useRef } from 'react';
import { getContactMessagesAdmin, deleteContactMessageAdmin } from '../../api';
import { useToast } from '../../context';
import { exportContactsToCsv } from './admin.utils';

export default function useAdminContacts() {
  const toast = useToast();

  const [messages, setMessages] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');

  const [inspectMessage, setInspectMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, message: null });
  const [deletingId, setDeletingId] = useState(null);

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keep track of active requests to prevent race conditions
  const activeReqIdRef = useRef(0);

  const fetchMessages = useCallback(
    async (isBackgroundRefresh = false) => {
      const currentReqId = ++activeReqIdRef.current;

      if (isBackgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = {
          page,
          limit,
        };

        if (topicFilter && topicFilter !== 'all') {
          params.enquiryTopic = topicFilter;
        }

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        const res = await getContactMessagesAdmin(params);

        if (currentReqId !== activeReqIdRef.current) return;

        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : [];
          setMessages(list);

          const pagination = res.pagination || {};
          const totalRecs = typeof pagination.totalRecords === 'number' ? pagination.totalRecords : list.length;
          setTotalMessages(totalRecs);
          setTotalPages(pagination.totalPages || Math.ceil(totalRecs / limit) || 1);
          setHasNextPage(Boolean(pagination.hasNextPage));
          setHasPreviousPage(Boolean(pagination.hasPreviousPage));
        } else {
          setError(res?.message || 'Failed to fetch contact inquiries.');
        }
      } catch (err) {
        if (currentReqId !== activeReqIdRef.current) return;
        const msg = err.response?.data?.message || err.message || 'Unable to connect to the server.';
        setError(msg);
      } finally {
        if (currentReqId === activeReqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, limit, topicFilter, debouncedSearch]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch
    fetchMessages();
  }, [fetchMessages]);

  const handleRefresh = useCallback(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  const handlePageChange = useCallback((newPage) => {
    setPage(Math.max(1, newPage));
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((q) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  const handleTopicFilterChange = useCallback((topic) => {
    setTopicFilter(topic);
    setPage(1);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!messages || messages.length === 0) {
      toast?.error('No contact messages available to export.');
      return false;
    }
    const success = exportContactsToCsv(messages, `contact-inquiries-page-${page}.csv`);
    if (success) {
      toast?.success('Contact inquiries exported to CSV successfully.');
    }
    return success;
  }, [messages, page, toast]);

  const promptDeleteMessage = useCallback((message) => {
    if (!message) return;
    setDeleteModal({ open: true, message });
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (deletingId) return;
    setDeleteModal({ open: false, message: null });
  }, [deletingId]);

  const handleDeleteMessage = useCallback(
    async (target) => {
      const targetId = typeof target === 'string' ? target : target?.id;
      if (!targetId) return;

      setDeletingId(targetId);
      try {
        const res = await deleteContactMessageAdmin(targetId);
        if (res?.success) {
          // Remove from local list
          setMessages((prev) => prev.filter((m) => m.id !== targetId));
          setTotalMessages((prev) => Math.max(0, prev - 1));

          // If currently open in inspect modal, close it
          setInspectMessage((prev) => (prev?.id === targetId ? null : prev));

          // Close delete modal
          setDeleteModal({ open: false, message: null });

          toast?.success(res.message || 'Contact inquiry deleted successfully.');
        } else {
          toast?.error(res?.message || 'Failed to delete contact inquiry.');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete contact inquiry.';
        toast?.error(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [toast]
  );

  // Derived stats from current view
  const topicCounts = messages.reduce((acc, msg) => {
    const t = (msg.enquiryTopic || 'general').toLowerCase();
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return {
    messages,
    totalMessages,
    totalPages,
    page,
    limit,
    hasNextPage,
    hasPreviousPage,
    loading,
    refreshing,
    error,
    searchQuery,
    debouncedSearch,
    topicFilter,
    topicCounts,
    inspectMessage,
    setInspectMessage,
    deleteModal,
    deletingId,
    promptDeleteMessage,
    closeDeleteModal,
    handleDeleteMessage,
    fetchMessages,
    handleRefresh,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleTopicFilterChange,
    handleExportCsv,
  };
}
