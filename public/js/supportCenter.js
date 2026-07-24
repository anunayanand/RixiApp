let activeTicketId = null;
  let lastAdminMessageId = null;
  let adminChatPollInterval = null;
  let currentInternObjectId = null;

  window.addEventListener("DOMContentLoaded", () => {
    fetchTicketList();
    setInterval(fetchTicketList, 10000);
    
    // Theme setup in JS
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    function updateThemeIcon(theme) {
      if (theme === 'dark') {
        themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
      } else {
        themeIcon.classList.replace('bi-sun-fill', 'bi-moon-fill');
      }
    }
    
    updateThemeIcon(document.documentElement.getAttribute('data-theme'));
    
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
      updateThemeIcon(nextTheme);
    });
  });

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function fetchTicketList() {
    fetch('/chat/tickets')
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          document.getElementById('adminTicketList').innerHTML = `<div class="text-center text-danger p-4 small">Error: ${escapeHtml(data.message)}</div>`;
          return;
        }
        renderTicketList(data.tickets);
      }).catch(err => {
        console.error(err);
        document.getElementById('adminTicketList').innerHTML = `<div class="text-center text-danger p-4 small">Network/Client Error: ${escapeHtml(err.message)}</div>`;
      });
  }

  function renderTicketList(tickets) {
    const listEl = document.getElementById('adminTicketList');
    
    // Ensure closed tickets are strictly hidden on the frontend
    tickets = tickets ? tickets.filter(t => t.status !== 'closed') : [];
    
    if (tickets.length === 0) {
      listEl.innerHTML = '<div class="text-center text-muted p-4 small">No active support tickets.</div>';
      return;
    }

    let html = '';
    tickets.forEach(ticket => {
      let internName = ticket.internId ? ticket.internId.name : 'Unknown Intern';
      let time = new Date(ticket.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
      let statusClass = ticket.status === 'pending' ? 'ticket-status-pending' : 'ticket-status-accepted';
      let statusText = ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);
      let isActive = ticket._id === activeTicketId ? 'active' : '';
      let isUnread = ticket.unreadCount > 0;
      let unreadBadge = isUnread ? `<div class="whatsapp-badge">${ticket.unreadCount}</div>` : '';
      let timeClass = isUnread ? 'ticket-time unread' : 'ticket-time';

      let avatarHtml = (ticket.internId && ticket.internId.img_url) 
        ? `<img src="${ticket.internId.img_url}" alt="Avatar">` 
        : `${internName.charAt(0).toUpperCase()}`;
        
      let statusIconHtml = ticket.status === 'pending' ? `<div class="ticket-status-icon ${statusClass}"><i class="bi bi-clock"></i></div>` : '';

      html += `
        <div class="chat-ticket-item ${isActive}" onclick="openChatTicket('${ticket._id}', '${ticket.status}', '${escapeHtml(ticket.subject)}', '${escapeHtml(internName)}', '${ticket.internId ? ticket.internId.intern_id : ''}', '${ticket.internId ? ticket.internId.img_url : ''}', '${ticket.internId ? ticket.internId._id : ''}')">
          <div class="ticket-avatar">
            ${avatarHtml}
          </div>
          <div class="ticket-content">
            <div class="ticket-content-top">
              <div class="ticket-name">${escapeHtml(internName)}</div>
              <div class="${timeClass}">${time}</div>
            </div>
            <div class="ticket-content-bottom">
              ${statusIconHtml}
              <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
              ${unreadBadge}
            </div>
          </div>
        </div>
      `;
    });
    listEl.innerHTML = html;
  }

  function openChatTicket(ticketId, status, subject, internName, internIdStr, internImg, internObjId) {
    activeTicketId = ticketId;
    lastAdminMessageId = null;
    currentInternObjectId = internObjId;

    document.getElementById('supportContainer').classList.add('chat-open'); // for mobile

    document.getElementById('adminChatEmpty').classList.add('d-none');
    document.getElementById('adminChatActive').classList.remove('d-none');

    document.getElementById('adminChatInternName').innerText = internName;
    document.getElementById('adminChatSubject').innerText = subject;
    if (internImg) document.getElementById('adminChatInternImg').src = internImg;

    document.getElementById('adminChatMessagesBox').innerHTML = ''; 

    const actionsDiv = document.getElementById('adminChatActions');
    if (status === 'pending') {
      actionsDiv.innerHTML = `<button class="btn btn-sm btn-success rounded-pill px-3 shadow-sm" onclick="acceptTicket('${ticketId}')"><i class="bi bi-check2 me-1"></i>Accept</button>`;
      document.getElementById('adminChatInputMessage').disabled = true;
      document.getElementById('adminChatSendBtn').disabled = true;
    } else {
      actionsDiv.innerHTML = `<button class="btn btn-sm btn-danger rounded-pill px-3 shadow-sm" onclick="closeTicket('${ticketId}')"><i class="bi bi-x-lg me-1"></i>Close</button>`;
      document.getElementById('adminChatInputMessage').disabled = false;
      document.getElementById('adminChatSendBtn').disabled = false;

      if (adminChatPollInterval) clearInterval(adminChatPollInterval);
      pollAdminMessages();
      adminChatPollInterval = setInterval(pollAdminMessages, 3000);
      markAdminMessagesAsRead(ticketId);
    }

    document.querySelectorAll('.chat-ticket-item').forEach(el => el.classList.remove('active'));
    if(event && event.currentTarget) event.currentTarget.classList.add('active');

    pingInternOnlineStatus();
  }

  function closeMobileChat() {
    document.getElementById('supportContainer').classList.remove('chat-open');
  }

  function pingInternOnlineStatus() {
    if (!currentInternObjectId || !activeTicketId) return;
    fetch('/chat/ping-intern/' + currentInternObjectId, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const dot = document.getElementById('pingStatusDotAdmin');
        const txt = document.getElementById('pingStatusTextAdmin');
        const statusDot = document.getElementById('adminChatInternStatus');
        const statusText = document.getElementById('adminChatInternStatusText');

        const isOnline = data.success && data.isOnline;
        
        if (dot && txt) {
          dot.className = isOnline ? 'rounded-circle bg-success' : 'rounded-circle bg-secondary';
          dot.style.width = '10px'; dot.style.height = '10px';
          txt.innerText = isOnline ? 'Online' : 'Offline';
          txt.className = isOnline ? 'text-success' : 'text-secondary';
        }
        if (statusDot && statusText) {
          statusDot.className = isOnline ? 'position-absolute bottom-0 end-0 border border-2 rounded-circle bg-success' : 'position-absolute bottom-0 end-0 border border-2 rounded-circle bg-secondary';
          statusDot.style.borderColor = 'var(--header-bg)';
          statusText.innerText = isOnline ? 'Online' : 'Offline';
        }
      }).catch(console.error);
  }

  setInterval(pingInternOnlineStatus, 10000);

  function acceptTicket(ticketId) {
    fetch(`/chat/ticket/${ticketId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).then(data => {
      if (data.success) {
        fetchTicketList();
        openChatTicket(ticketId, 'accepted', document.getElementById('adminChatSubject').innerText, document.getElementById('adminChatInternName').innerText, '', document.getElementById('adminChatInternImg').src, currentInternObjectId);
      }
    });
  }

  let ticketToCloseId = null;

  function closeTicket(ticketId) {
    ticketToCloseId = ticketId;
    const confirmModal = new bootstrap.Modal(document.getElementById('customConfirmModal'));
    confirmModal.show();
  }

  function confirmCloseTicket() {
    if (!ticketToCloseId) return;
    const ticketId = ticketToCloseId;
    ticketToCloseId = null;
    
    const modalEl = document.getElementById('customConfirmModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    fetch(`/chat/ticket/${ticketId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json()).then(data => {
      if (data.success) {
        activeTicketId = null;
        if (adminChatPollInterval) clearInterval(adminChatPollInterval);
        document.getElementById('adminChatEmpty').classList.remove('d-none');
        document.getElementById('adminChatActive').classList.add('d-none');
        fetchTicketList();
        closeMobileChat();
      }
    });
  }

  function pollAdminMessages() {
    if (!activeTicketId) return;
    let url = `/chat/messages/${activeTicketId}`;
    if (lastAdminMessageId) url += `?lastMessageId=${lastAdminMessageId}`;

    fetch(url, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        if (data.status === 'closed') { closeTicket(activeTicketId); return; }

        if (data.messages && data.messages.length > 0 && data.status === 'accepted') {
          const box = document.getElementById('adminChatMessagesBox');
          data.messages.forEach(msg => {
            renderAdminMessage(msg, box);
            lastAdminMessageId = msg._id;
          });
          box.scrollTop = box.scrollHeight;
          markAdminMessagesAsRead(activeTicketId);
        }
      }).catch(console.error);
  }

  function renderAdminMessage(msg, box) {
    if (document.getElementById(`msg-${msg._id}`)) return;
    
    const isAdmin = msg.senderRole === 'admin';
    const time = new Date(msg.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const bubbleWrap = document.createElement('div');
    bubbleWrap.id = `msg-${msg._id}`;
    bubbleWrap.className = `chat-bubble ${isAdmin ? 'chat-bubble-admin' : 'chat-bubble-intern'}`;
    bubbleWrap.innerHTML = `<span style="white-space: pre-wrap;">${escapeHtml(msg.text)}</span><span class="chat-time">${time}</span>`;
    box.appendChild(bubbleWrap);
  }

  document.getElementById('adminChatSendBtn')?.addEventListener('click', sendAdminMessage);
  document.getElementById('adminChatInputMessage')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAdminMessage(); }
  });

  function sendAdminMessage() {
    const input = document.getElementById('adminChatInputMessage');
    const text = input.value.trim();
    if (!text || !activeTicketId) return;
    input.value = '';
    document.getElementById('adminEmojiPanel').classList.remove('show');

    fetch('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: activeTicketId, text })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        renderAdminMessage(data.message, document.getElementById('adminChatMessagesBox'));
        lastAdminMessageId = data.message._id;
        document.getElementById('adminChatMessagesBox').scrollTop = document.getElementById('adminChatMessagesBox').scrollHeight;
      }
    });
  }

  function markAdminMessagesAsRead(ticketId) {
    fetch(`/chat/mark-read/${ticketId}`, { method: 'POST' });
  }

  const ADMIN_EMOJIS = ["👍", "👎", "😊", "😂", "🙌", "👏", "✅", "❌", "❓", "👀", "💡", "🚀", "💻", "😅", "😎", "🔥", "💼", "⭐", "🎉", "👍🏻"];
  const aEmojiPanel = document.getElementById('adminEmojiPanel');
  const aToggleEmojiBtn = document.getElementById('adminToggleEmojiBtn');
  if (aEmojiPanel && aToggleEmojiBtn) {
    ADMIN_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'emoji-btn'; btn.innerText = emoji;
      btn.onclick = () => { const input = document.getElementById('adminChatInputMessage'); input.value += emoji; input.focus(); };
      aEmojiPanel.appendChild(btn);
    });
    aToggleEmojiBtn.addEventListener('click', (e) => { e.stopPropagation(); aEmojiPanel.classList.toggle('show'); });
    document.addEventListener('click', (e) => { if (!aEmojiPanel.contains(e.target) && e.target !== aToggleEmojiBtn) aEmojiPanel.classList.remove('show'); });
  }

  // Online/Offline Status Tracking
  function updateOnlineStatus(isOnline) {
    if (!isOnline && navigator.sendBeacon) {
      navigator.sendBeacon('/chat/status', new Blob([JSON.stringify({ isOnline: false })], { type: 'application/json' }));
    } else {
      fetch('/chat/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline })
      }).catch(console.error);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    updateOnlineStatus(true);
    setInterval(() => updateOnlineStatus(true), 30000); // 30s heartbeat
  });

  window.addEventListener('beforeunload', () => updateOnlineStatus(false));
  document.addEventListener('visibilitychange', () => updateOnlineStatus(document.visibilityState !== 'hidden'));