let activeTicketId = null;
  let lastAdminMessageId = null;
  let currentInternObjectId = null;
  let socket = null;
  let allTicketsData = [];

  window.addEventListener("DOMContentLoaded", () => {
    socket = io();
    
    socket.on('new_message', (msg) => {
      if (activeTicketId === msg.ticketId) {
        renderAdminMessage(msg, document.getElementById('adminChatMessagesBox'));
        const box = document.getElementById('adminChatMessagesBox');
        box.scrollTop = box.scrollHeight;
        
        // If it's from the intern, mark it as read immediately and notify server via socket
        if (msg.senderRole === 'intern') {
          markAdminMessagesAsRead(activeTicketId);
          socket.emit('message_read', { messageId: msg._id, ticketId: activeTicketId });
        } else {
          // If it's my own message from another session maybe, just update last message ID
          lastAdminMessageId = msg._id;
        }
      }
    });

    socket.on('message_status_update', (data) => {
      if (!activeTicketId) return;
      const tickSpan = document.getElementById(`tick-${data.messageId}`);
      if (tickSpan) {
        if (data.status === 'delivered') {
          tickSpan.innerHTML = '<i class="bi bi-check-all"></i>';
          tickSpan.classList.remove('read');
        } else if (data.status === 'read') {
          tickSpan.innerHTML = '<i class="bi bi-check-all"></i>';
          tickSpan.classList.add('read');
        }
      }
    });

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
        allTicketsData = data.tickets || [];
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
    const internImgEl = document.getElementById('adminChatInternImg');
    if (internImg) internImgEl.src = internImg;
    internImgEl.style.cursor = 'pointer';
    internImgEl.setAttribute('onclick', 'openInternDetailsModal()');

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

      // Socket Join Room
      socket.emit('join_ticket', ticketId);

      // Load Historical Messages once
      loadAdminHistoricalMessages();
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
        document.getElementById('adminChatEmpty').classList.remove('d-none');
        document.getElementById('adminChatActive').classList.add('d-none');
        fetchTicketList();
        closeMobileChat();
      }
    });
  }

  function loadAdminHistoricalMessages() {
    if (!activeTicketId) return;
    let url = `/chat/messages/${activeTicketId}`;

    fetch(url, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        if (data.status === 'closed') { closeTicket(activeTicketId); return; }

        if (data.messages && data.messages.length > 0) {
          const box = document.getElementById('adminChatMessagesBox');
          box.innerHTML = ''; // clear first just in case
          data.messages.forEach(msg => {
            renderAdminMessage(msg, box);
            lastAdminMessageId = msg._id;
            
            // If it's a message from the intern and not read yet, send a delivery receipt if we just opened it
            if (msg.senderRole === 'intern' && !msg.isRead) {
               socket.emit('message_read', { messageId: msg._id, ticketId: activeTicketId });
            }
          });
          box.scrollTop = box.scrollHeight;
        }
      }).catch(console.error);
  }

  function renderAdminMessage(msg, box) {
    if (document.getElementById(`msg-${msg._id}`)) return;
    
    const isAdmin = msg.senderRole === 'admin';
    const time = new Date(msg.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    
    let isRead     = msg.status === 'read' || msg.isRead;
    let isDelivered = msg.status === 'delivered';

    // Determine tick icon and read state
    let tickIcon = '';
    let tickReadClass = '';
    if (isAdmin) {
      if (isRead) {
        tickIcon = '<i class="bi bi-check-all"></i>';
        tickReadClass = 'read';
      } else if (isDelivered) {
        tickIcon = '<i class="bi bi-check-all"></i>';
      } else {
        tickIcon = '<i class="bi bi-check"></i>';
      }
    }

    // Build meta row (time + ticks) — floated right
    const metaHtml = `<span class="chat-meta">
      <span class="chat-time">${time}</span>
      ${isAdmin ? `<span class="chat-ticks ${tickReadClass}" id="tick-${msg._id}">${tickIcon}</span>` : ''}
    </span>`;

    // Invisible tail spacer so meta never overlaps text
    const tailHtml = `<span class="chat-bubble-tail"></span>`;

    let contentHtml = '';
    if (msg.type === 'image' && msg.imageUrl) {
      // For image messages, show meta below the image inline
      contentHtml = `<img src="${msg.imageUrl}" alt="Image" class="chat-image-attachment" onclick="openImageLightbox('${msg.imageUrl}')">
        <span class="chat-bubble-body">${escapeHtml(msg.text || '')}${tailHtml}</span>${metaHtml}`;
    } else {
      contentHtml = `<span class="chat-bubble-body">${escapeHtml(msg.text)}${tailHtml}</span>${metaHtml}`;
    }

    const bubbleWrap = document.createElement('div');
    bubbleWrap.id = `msg-${msg._id}`;
    bubbleWrap.className = `chat-bubble ${isAdmin ? 'chat-bubble-admin' : 'chat-bubble-intern'}`;
    bubbleWrap.innerHTML = contentHtml;
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
    input.style.height = 'auto'; // Reset height after send
    document.getElementById('adminEmojiPanel').classList.remove('show');

    // Create a temporary message bubble for instant feedback (optional, skipping for simplicity)

    fetch('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: activeTicketId, text })
    }).then(res => res.json()).then(data => {
      // Message rendered via socket on server broadcast
      if(data.success && data.message) {
         // Also emit sent receipt? The server broadcasts so we just wait for socket, 
         // but since we don't broadcast to sender in standard io.to() if it's the same socket? 
         // Actually global.io.to() sends to everyone in the room. So we will receive it via socket.
         // Let's just ensure we only render it once (which renderAdminMessage handles with msg._id check).
      }
    });
  }

  // Handle Image Upload via Modal
  const adminModalImageInput = document.getElementById('adminModalImageInput');
  const adminImagePreviewContainer = document.getElementById('adminImagePreviewContainer');
  const adminImagePreview = document.getElementById('adminImagePreview');
  const adminSendImageBtn = document.getElementById('adminSendImageBtn');
  let currentSelectedFile = null;

  adminModalImageInput?.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      currentSelectedFile = file;
      const reader = new FileReader();
      reader.onload = function(e) {
        adminImagePreview.src = e.target.result;
        adminImagePreviewContainer.classList.remove('d-none');
      }
      reader.readAsDataURL(file);
    } else {
      currentSelectedFile = null;
      adminImagePreviewContainer.classList.add('d-none');
      adminImagePreview.src = '';
    }
  });

  // Handle modal closing to reset fields
  const imageUploadModalEl = document.getElementById('adminImageUploadModal');
  if (imageUploadModalEl) {
    imageUploadModalEl.addEventListener('hidden.bs.modal', function () {
      adminModalImageInput.value = '';
      currentSelectedFile = null;
      adminImagePreviewContainer.classList.add('d-none');
      adminImagePreview.src = '';
      document.getElementById('adminImageCaption').value = '';
      adminSendImageBtn.disabled = false;
      adminSendImageBtn.innerHTML = '<i class="bi bi-send-fill me-2"></i> Send';
    });
  }

  adminSendImageBtn?.addEventListener('click', function() {
    if (!currentSelectedFile || !activeTicketId) return;

    const captionInput = document.getElementById('adminImageCaption');
    const formData = new FormData();
    formData.append("image", currentSelectedFile);
    formData.append("ticketId", activeTicketId);
    
    if (captionInput.value.trim()) {
      formData.append("text", captionInput.value.trim());
    }

    // Show loading state
    adminSendImageBtn.disabled = true;
    adminSendImageBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';

    fetch('/chat/image', {
      method: 'POST',
      body: formData
    }).then(res => res.json()).then(data => {
      // Close modal on success
      const modalInstance = bootstrap.Modal.getInstance(imageUploadModalEl);
      if (modalInstance) modalInstance.hide();
    }).catch(err => {
      console.error(err);
      adminSendImageBtn.disabled = false;
      adminSendImageBtn.innerHTML = '<i class="bi bi-send-fill me-2"></i> Send';
    });
  });

  // Auto-resize textarea
  const adminChatInput = document.getElementById('adminChatInputMessage');
  if (adminChatInput) {
    adminChatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      if (this.scrollHeight > 120) {
        this.style.overflowY = 'auto';
      } else {
        this.style.overflowY = 'hidden';
      }
    });
  }

  function markAdminMessagesAsRead(ticketId) {
    fetch(`/chat/mark-read/${ticketId}`, { method: 'POST' });
  }

  function openImageLightbox(url) {
    const lightboxImage = document.getElementById('adminLightboxImage');
    if (lightboxImage) {
      lightboxImage.src = url;
      const modalEl = document.getElementById('adminImageLightboxModal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
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

  function openInternDetailsModal() {
    if (!activeTicketId) return;
    const ticket = allTicketsData.find(t => t._id === activeTicketId);
    if (!ticket || !ticket.internId) return;
    
    const intern = ticket.internId;
    const imgEl = document.getElementById('internDetailsImg');
    if (imgEl) imgEl.src = intern.img_url || '/img/default-avatar.png';
    
    const fields = {
      'internDetailsName': intern.name,
      'internDetailsId': intern.intern_id,
      'internDetailsEmail': intern.email,
      'internDetailsDomain': intern.domain,
      'internDetailsProgress': (intern.progress || 0) + '%',
      'internDetailsQuizScore': intern.quiz_score || 0
    };

    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.innerText = value || 'N/A';
    }
    
    const modalEl = document.getElementById('internDetailsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }