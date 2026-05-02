/**
 * Centralized Notification Logic for RixiApp
 * Handles fetching, rendering, and marking notifications as read.
 */

document.addEventListener('DOMContentLoaded', () => {
  const notifButton = document.getElementById('notificationButton');
  const notifList = document.getElementById('notificationItems');
  const unreadBadge = document.getElementById('unreadBadge');
  const clearAllBtn = document.getElementById('clearAllBtn');

  if (!notifButton || !notifList) return;

  // Track if dropdown is open
  let isOpen = false;

  notifButton.addEventListener('click', async () => {
    isOpen = !isOpen;
    if (isOpen) {
      await fetchNotifications();
    }
  });

  async function fetchNotifications() {
    notifList.innerHTML = '<li class="p-4 text-center text-muted small">Loading...</li>';
    try {
      const response = await fetch('/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      
      renderNotifications(data.notifications);
      
      // Update badge
      updateBadge(data.unreadCount);
      
      // Show/hide clear all button
      if (clearAllBtn) {
        clearAllBtn.style.display = data.notifications.length > 0 ? 'block' : 'none';
      }
    } catch (err) {
      console.error(err);
      notifList.innerHTML = '<li class="p-4 text-center text-danger small">Failed to load notifications</li>';
    }
  }

  function renderNotifications(notifications) {
    if (!notifications || notifications.length === 0) {
      notifList.innerHTML = '<li class="p-4 text-center text-muted small">No new notifications 🎉</li>';
      return;
    }

    notifList.innerHTML = notifications.map(n => `
      <li class="notif-item ${n.isRead ? 'read' : 'unread'} d-flex justify-content-between align-items-start p-3 border-bottom" data-id="${n._id}">
        <div>
          <strong style="font-size: 0.9rem;">${n.title}</strong>
          <small class="text-muted d-block mt-1">${n.message}</small>
          <small class="text-primary mt-1 d-block" style="font-size: 0.65rem;">
            ${new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </small>
        </div>
        ${!n.isRead ? `
          <button class="btn btn-sm btn-link text-success mark-read-btn p-0 ms-2" title="Mark as Read" data-id="${n._id}">
            <i class="bi bi-check2-circle fs-5"></i>
          </button>
        ` : ''}
      </li>
    `).join('');

    // Attach mark as read listeners
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await markAsRead(id, btn.closest('.notif-item'));
      });
    });
  }

  async function markAsRead(id, listItem) {
    try {
      const response = await fetch(`/notifications/read/${id}`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to mark as read');
      
      const data = await response.json();
      
      // Remove or update the item visually
      listItem.classList.remove('unread');
      listItem.classList.add('read');
      const btn = listItem.querySelector('.mark-read-btn');
      if(btn) btn.remove();

      // We could also remove it from the list completely if we only want unread ones
      // listItem.remove();
      // if (notifList.children.length === 0) {
      //   notifList.innerHTML = '<li class="p-4 text-center text-muted small">No new notifications 🎉</li>';
      // }

      updateBadge(data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const response = await fetch('/notifications/read-all', { method: 'PUT' });
        if (!response.ok) throw new Error('Failed to clear notifications');
        
        notifList.innerHTML = '<li class="p-4 text-center text-muted small">No new notifications 🎉</li>';
        clearAllBtn.style.display = 'none';
        updateBadge(0);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function updateBadge(count) {
    if (count > 0) {
      unreadBadge.textContent = count > 9 ? '9+' : count;
      unreadBadge.classList.remove('d-none');
    } else {
      unreadBadge.classList.add('d-none');
      unreadBadge.textContent = '0';
    }
  }
});
