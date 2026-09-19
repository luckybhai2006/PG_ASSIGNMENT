import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  User,
  Shield,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { playNotificationChime } from '../services/sound';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function TeamDrawer({ isOpen, onClose, initialTab = 'chat', pg: propPg }) {
  const { user, pg: authPg, myPGs } = useAuth();
  const { showToast } = useToast();

  const pg = propPg || authPg || (myPGs && myPGs[0]) || null;
  const activePgId = pg?._id || user?.pgId?._id || user?.pgId || '';

  const [activeTab, setActiveTab] = useState(initialTab); // 'chat' | 'tasks'
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  // Mention suggestions state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [selectedMentions, setSelectedMentions] = useState([]);

  // Create Task Form State (for Manager / Owner)
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskCategory, setTaskCategory] = useState('Maintenance');
  const [taskRoom, setTaskRoom] = useState('');
  const [taskCreating, setTaskCreating] = useState(false);

  // Task filter
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'mine' | 'pending' | 'done'

  // Completion note prompt
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [completionNote, setCompletionNote] = useState('');

  const chatEndRef = useRef(null);
  const isInitialChatLoadedRef = useRef(false);
  const lastChatTimestampRef = useRef(null);

  const canChat = user?.role === 'owner' || user?.permissions?.canChat !== false;
  const canAssign = user?.role === 'owner' || user?.permissions?.canAssignTasks === true;

  // Load initial data in parallel (blazing fast single-roundtrip)
  const loadData = async () => {
    try {
      setLoading(true);

      const staffPromise = api
        .getStaff(activePgId)
        .then((res) => {
          if ((!res.staff || res.staff.length === 0) && user?.role === 'owner') {
            return api.getStaff('ALL').catch(() => ({ staff: [] }));
          }
          return res;
        })
        .catch(() => ({ staff: [] }));

      const [msgRes, taskRes, staffRes] = await Promise.all([
        api.getTeamMessages(activePgId).catch(() => ({ messages: [] })),
        api.getTeamTasks({ pgId: activePgId }).catch(() => ({ tasks: [] })),
        staffPromise,
      ]);

      const loadedMsgs = msgRes.messages || [];
      setMessages(loadedMsgs);
      if (loadedMsgs.length > 0) {
        lastChatTimestampRef.current = loadedMsgs[loadedMsgs.length - 1].createdAt;
      }
      setTasks(taskRes.tasks || []);
      setTimeout(() => {
        isInitialChatLoadedRef.current = true;
      }, 350);

      const staffData = staffRes.staff || [];
      setStaffList(staffData);
      const myId = (user?._id || user?.id)?.toString();
      const available = staffData.filter((s) => (s._id || s.id)?.toString() !== myId);
      if (available.length > 0 && (!taskAssignee || taskAssignee === myId)) {
        setTaskAssignee(available[0]._id);
      }
    } catch (err) {
      console.error('Failed to load team hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      isInitialChatLoadedRef.current = false;
      lastChatTimestampRef.current = null;
      loadData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, activePgId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat' && isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, isOpen]);

  // Socket.io live listeners (Drawer is OPEN: render live silently without redundant popup toasts)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isOpen) return;

    const activePgId = pg?._id || user?.pgId?._id || user?.pgId;
    const joinRoom = () => {
      if (activePgId) socket.emit('join_pg', activePgId);
    };
    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    const handleNewMessage = (msg) => {
      if (!msg) return;
      if (msg.createdAt) {
        lastChatTimestampRef.current = msg.createdAt;
      }
      const myId = (user?._id || user?.id)?.toString();
      const msgSenderId = (msg.sender?._id || msg.sender)?.toString();
      if (msgSenderId && msgSenderId !== myId) {
        playNotificationChime();
      }
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        if (msgSenderId === myId) {
          const tempIdx = prev.findIndex(
            (m) => m._id && m._id.toString().startsWith('temp_') && m.text === msg.text
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = msg;
            return next;
          }
        }
        return [...prev, msg];
      });
    };

    const handleTaskAssigned = (data) => {
      const task = data.task || data;
      setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [task, ...prev]));
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    };

    socket.on('TEAM_MESSAGE_RECEIVED', handleNewMessage);
    socket.on('TASK_ASSIGNED', handleTaskAssigned);
    socket.on('TASK_CREATED', (t) => setTasks((prev) => (prev.some((x) => x._id === t._id) ? prev : [t, ...prev])));
    socket.on('TASK_STATUS_UPDATED', handleTaskUpdated);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('TEAM_MESSAGE_RECEIVED', handleNewMessage);
      socket.off('TASK_ASSIGNED', handleTaskAssigned);
      socket.off('TASK_CREATED');
      socket.off('TASK_STATUS_UPDATED', handleTaskUpdated);
    };
  }, [isOpen, user, pg?._id, user?.pgId]);

  // Live polling fallback when WebSocket is not connected (e.g. hosted on Vercel Serverless)
  useEffect(() => {
    if (!isOpen) return;
    const socket = getSocket();
    if (socket && socket.connected) return;

    // Never return early for owner even if activePgId is empty (backend defaults to owner's PG)
    if (!activePgId && user?.role !== 'owner') return;

    let isPolling = false;
    const pollInterval = setInterval(async () => {
      if (socket && socket.connected) return;
      if (isPolling) return;
      isPolling = true;

      try {
        if (activeTab === 'chat') {
          const params = { pgId: activePgId };
          if (lastChatTimestampRef.current && isInitialChatLoadedRef.current) {
            params.since = lastChatTimestampRef.current;
          }

          const res = await api.getTeamMessages(params);
          if (res?.messages && Array.isArray(res.messages)) {
            if (!isInitialChatLoadedRef.current) {
              setMessages(res.messages);
              if (res.messages.length > 0) {
                lastChatTimestampRef.current = res.messages[res.messages.length - 1].createdAt;
              }
              isInitialChatLoadedRef.current = true;
            } else if (res.messages.length > 0) {
              // High-concurrency delta update: only new incoming messages are returned!
              lastChatTimestampRef.current = res.messages[res.messages.length - 1].createdAt;

              setMessages((prev) => {
                const prevMap = new Map(prev.map((m) => [m._id?.toString(), m]));
                let hasNewFromOther = false;
                const next = [...prev];
                const myId = (user?._id || user?.id)?.toString();

                for (const m of res.messages) {
                  const idStr = m._id?.toString();
                  if (!prevMap.has(idStr)) {
                    const senderId = (m.sender?._id || m.sender)?.toString();
                    if (senderId === myId) {
                      const tempIdx = next.findIndex(
                        (item) => item._id && item._id.toString().startsWith('temp_') && item.text === m.text
                      );
                      if (tempIdx !== -1) {
                        next[tempIdx] = m;
                        continue;
                      }
                    } else {
                      hasNewFromOther = true;
                    }
                    next.push(m);
                  }
                }

                if (hasNewFromOther) {
                  playNotificationChime();
                }
                return next;
              });
            }
          }
        } else if (activeTab === 'tasks') {
          const res = await api.getTeamTasks({ pgId: activePgId });
          if (res?.tasks && Array.isArray(res.tasks)) {
            setTasks(res.tasks);
          }
        }
      } catch (_) {
        // silent catch
      } finally {
        isPolling = false;
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [isOpen, activeTab, activePgId, user?._id, user?.id, user?.role]);

  // Handle typing & @mention trigger
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (staff) => {
    const words = text.split(' ');
    words.pop();
    words.push(`@${staff.name} `);
    setText(words.join(' '));
    if (!selectedMentions.includes(staff._id)) {
      setSelectedMentions([...selectedMentions, staff._id]);
    }
    setMentionQuery(null);
  };

  // Send Chat Message (Optimistic 0ms UI)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !canChat) return;

    const currentPgId = activePgId;
    const sendText = text.trim();
    const sendMentions = selectedMentions;

    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      sender: user,
      text: sendText,
      mentions: sendMentions,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Instant 0ms render
    setMessages((prev) => [...prev, optimisticMsg]);
    setText('');
    setSelectedMentions([]);
    setMentionQuery(null);

    try {
      const socket = getSocket();
      let res = null;

      // Ultra-fast WebSocket send (<60ms round-trip worldwide)
      if (socket && socket.connected) {
        res = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            api.sendTeamMessage({ text: sendText, mentions: sendMentions, pgId: currentPgId })
              .then(resolve)
              .catch(reject);
          }, 1500);

          socket.emit(
            'SEND_TEAM_MESSAGE',
            {
              text: sendText,
              mentions: sendMentions,
              pgId: currentPgId,
            },
            (socketRes) => {
              clearTimeout(timer);
              if (socketRes && socketRes.success) {
                resolve(socketRes);
              } else {
                api.sendTeamMessage({ text: sendText, mentions: sendMentions, pgId: currentPgId })
                  .then(resolve)
                  .catch(reject);
              }
            }
          );
        });
      } else {
        res = await api.sendTeamMessage({
          text: sendText,
          mentions: sendMentions,
          pgId: currentPgId,
        });
      }

      if (res && res.message) {
        if (res.message.createdAt) {
          lastChatTimestampRef.current = res.message.createdAt;
        }
        setMessages((prev) => {
          const alreadyAdded = prev.some((m) => m._id === res.message._id);
          if (alreadyAdded) {
            return prev.filter((m) => m._id !== tempId);
          }
          return prev.map((m) => (m._id === tempId ? res.message : m));
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      showToast({ message: err.message || 'Failed to send message', type: 'error' });
    }
  };

  // Create & Assign Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssignee) return;

    setTaskCreating(true);
    const currentPgId = pg?._id || user?.pgId?._id || user?.pgId;
    try {
      const res = await api.createTeamTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assignedTo: taskAssignee,
        priority: taskPriority,
        category: taskCategory,
        roomNumber: taskRoom.trim(),
        postToChat: true, // Also post a nice card in chat!
        pgId: currentPgId,
      });

      if (res.task) {
        setTasks((prev) => (prev.some((t) => t._id === res.task._id) ? prev : [res.task, ...prev]));
        if (res.chatMessage) {
          setMessages((prev) => (prev.some((m) => m._id === res.chatMessage._id) ? prev : [...prev, res.chatMessage]));
        }
        showToast({
          title: 'Task Assigned',
          message: 'Task assigned successfully & posted to team chat!',
          type: 'success',
        });
        setTaskTitle('');
        setTaskDesc('');
        setTaskRoom('');
        setShowTaskForm(false);
      }
    } catch (err) {
      showToast({ message: err.message || 'Failed to assign task', type: 'error' });
    } finally {
      setTaskCreating(false);
    }
  };

  // Update Task Status (In Progress -> Done) with Instant 0ms Optimistic UI
  const handleUpdateStatus = async (taskId, newStatus) => {
    const note = completionNote;
    const prevTasks = tasks;

    // Instant 0ms optimistic UI update - close prompt and show Done state immediately
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? {
            ...t,
            status: newStatus,
            completionNote: newStatus === 'Done' ? note : t.completionNote,
            completedAt: newStatus === 'Done' ? new Date() : t.completedAt,
          }
          : t
      )
    );
    setCompletingTaskId(null);
    setCompletionNote('');

    try {
      const res = await api.updateTeamTaskStatus(taskId, {
        status: newStatus,
        completionNote: newStatus === 'Done' ? note : '',
      });
      if (res.task) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? res.task : t)));
      }
    } catch (err) {
      setTasks(prevTasks);
      showToast({ message: err.message || 'Failed to update status', type: 'error' });
    }
  };

  if (!isOpen) return null;

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'mine') return (t.assignedTo?._id || t.assignedTo) === user?._id;
    if (taskFilter === 'pending') return t.status !== 'Done';
    if (taskFilter === 'done') return t.status === 'Done';
    return true;
  });

  const pendingCount = tasks.filter((t) => (t.assignedTo?._id || t.assignedTo) === user?._id && t.status !== 'Done').length;

  // Exclude current user (Manager / Owner) so they cannot assign task to themselves
  const myId = (user?._id || user?.id)?.toString();
  const assignableStaff = staffList.filter((s) => {
    const sId = (s.userId?._id || s.userId || s._id || s.id)?.toString();
    return sId !== myId;
  });

  return (
    <>
      {/* Background Dim / Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 1200,
        }}
      />

      {/* Right-Side Slide Drawer (WhatsApp / Instagram Style) */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '450px',
          maxWidth: '100vw',
          background: 'var(--bg-card, #ffffff)',
          borderLeft: '1px solid var(--border-light, #e2e8f0)',
          boxShadow: '-12px 0 35px rgba(0, 0, 0, 0.18)',
          zIndex: 1201,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 4px; }
        `}</style>

        {/* Drawer Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-main, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary, #4f46e5)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px var(--primary-glow, rgba(79, 70, 229, 0.3))',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  Team Workspace
                </h3>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: 'var(--primary-light, #eef2ff)',
                    color: 'var(--primary, #4f46e5)',
                  }}
                >
                  {pg?.name || 'Facility'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                Manager-Staff Chat & Live Tasks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-light, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Switcher: Chat vs Tasks */}
        <div
          style={{
            display: 'flex',
            padding: '8px 14px',
            gap: '8px',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            background: 'var(--bg-card, #ffffff)',
          }}
        >
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: activeTab === 'chat' ? 'var(--primary, #4f46e5)' : 'var(--bg-hover, #f1f5f9)',
              color: activeTab === 'chat' ? '#ffffff' : 'var(--text-muted, #64748b)',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={15} />
            <span>Chat Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: activeTab === 'tasks' ? 'var(--primary, #4f46e5)' : 'var(--bg-hover, #f1f5f9)',
              color: activeTab === 'tasks' ? '#ffffff' : 'var(--text-muted, #64748b)',
              transition: 'all 0.15s ease',
            }}
          >
            <ClipboardList size={15} />
            <span>Tasks ({tasks.filter((t) => t.status !== 'Done').length})</span>
            {pendingCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: '10px',
                }}
              >
                {pendingCount} My
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: CHAT STREAM */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Quick Action Bar for Managers */}
            {canAssign && (
              <div
                style={{
                  padding: '7px 14px',
                  background: 'var(--primary-light, #f5f3ff)',
                  borderBottom: '1px solid var(--border-light, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.76rem',
                }}
              >
                <span style={{ color: 'var(--primary, #4f46e5)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} /> Manager Mode
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tasks');
                    setShowTaskForm(true);
                  }}
                  style={{
                    border: 'none',
                    background: 'var(--primary, #4f46e5)',
                    color: '#ffffff',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={12} /> Assign Task
                </button>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'var(--bg-main, #f8fafc)',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 4px' }}>
                  <div
                    style={{
                      alignSelf: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-muted, #64748b)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Loader2 size={14} className="spin-animation" style={{ color: 'var(--primary, #4f46e5)' }} />
                    <span>Loading chat stream...</span>
                  </div>

                  {/* Shimmering Chat Bubble Placeholders */}
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '80%', alignSelf: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-light, #e2e8f0)', flexShrink: 0 }} className="pulse-animation" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ width: '70px', height: '10px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} className="pulse-animation" />
                      <div style={{ width: '180px', height: '38px', borderRadius: '14px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-light, #e2e8f0)' }} className="pulse-animation" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', maxWidth: '75%', alignSelf: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ width: '140px', height: '34px', borderRadius: '14px', background: 'var(--primary-light, #eef2ff)', border: '1px solid rgba(79, 70, 229, 0.15)' }} className="pulse-animation" />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', maxWidth: '85%', alignSelf: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border-light, #e2e8f0)', flexShrink: 0 }} className="pulse-animation" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ width: '85px', height: '10px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} className="pulse-animation" />
                      <div style={{ width: '230px', height: '52px', borderRadius: '14px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-light, #e2e8f0)' }} className="pulse-animation" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', maxWidth: '70%', alignSelf: 'flex-end', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ width: '160px', height: '34px', borderRadius: '14px', background: 'var(--primary-light, #eef2ff)', border: '1px solid rgba(79, 70, 229, 0.15)' }} className="pulse-animation" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                  <MessageSquare size={34} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>No messages yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem' }}>
                    Type below or use @ to tag staff members and assign work!
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const myId = (user?._id || user?.id)?.toString();
                  const msgSenderId = (m.sender?._id || m.sender)?.toString();
                  const isMe = Boolean(msgSenderId && myId && msgSenderId === myId);
                  const isOwner = m.sender?.role === 'owner';
                  return (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Sender Info */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginBottom: '3px',
                          fontSize: '0.68rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                          {isMe ? 'You' : m.sender?.name || 'Staff'}
                        </span>
                        {isOwner && (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                            Owner
                          </span>
                        )}
                        <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble */}
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '9px 13px',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          background: isMe ? 'var(--primary, #4f46e5)' : 'var(--bg-card, #ffffff)',
                          color: isMe ? '#ffffff' : 'var(--text-main, #0f172a)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                          fontSize: '0.82rem',
                          lineHeight: '1.4',
                          border: isMe ? 'none' : '1px solid var(--border-light, #e2e8f0)',
                        }}
                      >
                        {m.text}

                        {/* Linked Task Card if any */}
                        {m.attachedTask && (
                          <div
                            onClick={() => setActiveTab('tasks')}
                            style={{
                              marginTop: '8px',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isMe ? 'rgba(255, 255, 255, 0.15)' : 'var(--bg-hover, #f8fafc)',
                              border: isMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid var(--border-light, #e2e8f0)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.76rem' }}>📋 {m.attachedTask.title}</span>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: m.attachedTask.status === 'Done' ? '#10b981' : '#f59e0b',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                }}
                              >
                                {m.attachedTask.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.68rem', marginTop: '3px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>Tap to view task in board</span>
                              <ChevronRight size={11} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Mention Suggestions Popover */}
            {mentionQuery !== null && (
              <div
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  borderTop: '1px solid var(--border-light, #e2e8f0)',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ padding: '5px 12px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted, #64748b)' }}>
                  TAG A STAFF MEMBER:
                </div>
                {staffList
                  .filter((s) => s.name.toLowerCase().includes(mentionQuery))
                  .map((s) => (
                    <div
                      key={s._id}
                      onClick={() => handleSelectMention(s)}
                      style={{
                        padding: '7px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f1f5f9)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <User size={13} color="var(--primary, #4f46e5)" />
                      <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>{s.name}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>• {s.email}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Chat Input Field */}
            {canChat ? (
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '10px 14px',
                  borderTop: '1px solid var(--border-light, #e2e8f0)',
                  background: 'var(--bg-card, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Type a message... (Type @ to tag staff)"
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    padding: '0 12px',
                    fontSize: '0.82rem',
                    background: 'var(--bg-main, #f8fafc)',
                    color: 'var(--text-main, #0f172a)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  style={{
                    height: '38px',
                    width: '38px',
                    borderRadius: '8px',
                    border: 'none',
                    background: text.trim() ? 'var(--primary, #4f46e5)' : 'var(--bg-hover, #f1f5f9)',
                    color: text.trim() ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: text.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', background: 'var(--bg-main, #f8fafc)' }}>
                Owner has set this staff account to view-only mode for chat.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TASKS BOARD */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Filter Pills & Assign Button */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-light, #e2e8f0)',
                background: 'var(--bg-main, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                {['all', 'mine', 'pending', 'done'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      background: taskFilter === f ? 'var(--primary, #4f46e5)' : 'var(--bg-card, #ffffff)',
                      color: taskFilter === f ? '#ffffff' : 'var(--text-muted, #64748b)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'mine' ? 'My Tasks' : f === 'pending' ? 'Pending' : 'Done'}
                  </button>
                ))}
              </div>

              {canAssign && (
                <button
                  type="button"
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: showTaskForm ? 'var(--text-muted, #64748b)' : 'var(--primary, #4f46e5)',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} />
                  <span>{showTaskForm ? 'Cancel' : 'New Task'}</span>
                </button>
              )}
            </div>

            {/* Quick Task Creation Form */}
            {showTaskForm && canAssign && (
              <form
                onSubmit={handleCreateTask}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-card, #ffffff)',
                  borderBottom: '1.5px solid var(--primary-light, #eef2ff)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-main, #0f172a)' }}>
                  Assign Task to Staff
                </div>
                <input
                  type="text"
                  placeholder="Task title (e.g. Clean Room 204 or Fix Wi-Fi router)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  style={{
                    height: '34px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-light, #e2e8f0)',
                    padding: '0 10px',
                    fontSize: '0.78rem',
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 105px', gap: '6px', width: '100%' }}>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      minWidth: 0,
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      fontSize: '0.74rem',
                      padding: '0 6px',
                      background: 'var(--bg-main, #f8fafc)',
                      color: 'var(--text-main, #0f172a)',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <option value="">
                      {assignableStaff.length === 0
                        ? '⚠️ No staff available'
                        : `-- Assignee (${assignableStaff.length} Staff) * --`}
                    </option>
                    {assignableStaff.map((s) => (
                      <option key={s._id} value={s._id}>
                        👤 {s.name} ({s.staffRole === 'manager' ? 'Manager' : 'Staff'})
                      </option>
                    ))}
                  </select>

                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{
                      width: '100%',
                      minWidth: 0,
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      fontSize: '0.74rem',
                      padding: '0 6px',
                      background: 'var(--bg-main, #f8fafc)',
                      color: 'var(--text-main, #0f172a)',
                      fontWeight: 600,
                    }}
                    title="Task Priority"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Room # (optional)"
                    value={taskRoom}
                    onChange={(e) => setTaskRoom(e.target.value)}
                    style={{
                      width: '120px',
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      padding: '0 8px',
                      fontSize: '0.74rem',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Short description / details"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    style={{
                      flex: 1,
                      height: '32px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      padding: '0 8px',
                      fontSize: '0.74rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={taskCreating || !taskTitle.trim() || !taskAssignee}
                  style={{
                    height: '34px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary, #4f46e5)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={14} />
                  <span>{taskCreating ? 'Assigning...' : 'Assign & Notify Staff'}</span>
                </button>
              </form>
            )}

            {/* Task List */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--bg-main, #f8fafc)',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '6px 0' }}>
                  <div
                    style={{
                      alignSelf: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'var(--bg-card, #ffffff)',
                      border: '1px solid var(--border-light, #e2e8f0)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-muted, #64748b)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Loader2 size={14} className="spin-animation" style={{ color: 'var(--primary, #4f46e5)' }} />
                    <span>Loading live tasks...</span>
                  </div>

                  {[1, 2, 3].map((k) => (
                    <div
                      key={k}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                      className="pulse-animation"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ width: '80px', height: '14px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} />
                        <div style={{ width: '60px', height: '14px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} />
                      </div>
                      <div style={{ width: '70%', height: '16px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} />
                      <div style={{ width: '50%', height: '12px', borderRadius: '4px', background: 'var(--border-light, #e2e8f0)' }} />
                    </div>
                  ))}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                  <ClipboardList size={34} style={{ opacity: 0.35, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>No tasks in this view</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem' }}>
                    Tasks assigned by Manager or Owner will show here.
                  </p>
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isAssignee = (t.assignedTo?._id || t.assignedTo) === user?._id;
                  const isDone = t.status === 'Done';
                  const isInProgress = t.status === 'In Progress';
                  const priorityColor =
                    t.priority === 'Urgent'
                      ? '#ef4444'
                      : t.priority === 'High'
                        ? '#f97316'
                        : t.priority === 'Medium'
                          ? '#eab308'
                          : '#10b981';

                  return (
                    <div
                      key={t._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: priorityColor,
                              background: `${priorityColor}15`,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${priorityColor}30`,
                            }}
                          >
                            {t.priority}
                          </span>
                          {t.roomNumber && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
                              Room {t.roomNumber}
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isDone ? '#dcfce7' : isInProgress ? '#e0f2fe' : '#fef9c3',
                            color: isDone ? '#15803d' : isInProgress ? '#0369a1' : '#a16207',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isDone ? <CheckCircle size={11} /> : <Clock size={11} />}
                          {t.status}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main, #0f172a)' }}>
                          {t.title}
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                            {t.description}
                          </div>
                        )}
                      </div>

                      {/* People Details */}
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted, #64748b)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-light, #e2e8f0)',
                          paddingTop: '6px',
                        }}
                      >
                        <div>
                          Assigned to: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{t.assignedTo?.name || 'Staff'}</strong>
                        </div>
                        <div>
                          By: <strong>{t.assignedBy?.name || 'Manager'}</strong>
                        </div>
                      </div>

                      {/* Completed note if done */}
                      {isDone && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#15803d',
                            background: '#f0fdf4',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                          }}
                        >
                          ✓ Completed on {new Date(t.completedAt || t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {t.completionNote && <span> • Note: "{t.completionNote}"</span>}
                        </div>
                      )}

                      {/* Actions for Assigned Staff or Manager */}
                      {!isDone && (isAssignee || canAssign) && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          {!isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(t._id, 'In Progress')}
                              style={{
                                flex: 1,
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light, #e2e8f0)',
                                background: 'var(--bg-hover, #f8fafc)',
                                color: 'var(--text-main, #0f172a)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Start Working
                            </button>
                          )}

                          {completingTaskId === t._id ? (
                            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                              <input
                                type="text"
                                placeholder="Completion note (optional)"
                                value={completionNote}
                                onChange={(e) => setCompletionNote(e.target.value)}
                                style={{
                                  flex: 1,
                                  height: '28px',
                                  fontSize: '0.72rem',
                                  borderRadius: '6px',
                                  border: '1px solid #86efac',
                                  padding: '0 6px',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(t._id, 'Done')}
                                style={{
                                  padding: '0 8px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCompletingTaskId(t._id)}
                              style={{
                                flex: 1,
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle size={12} />
                              <span>Mark Done</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
