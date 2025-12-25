 document.addEventListener("DOMContentLoaded", function () {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function (toastEl) {
      const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
      toast.show();
    });
  });

  // Function to show dynamic toasts
  function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();

    const toastClasses = {
      success: 'text-bg-success',
      error: 'text-bg-danger',
      info: 'text-bg-info',
      warning: 'text-bg-warning'
    };

    const toastClass = toastClasses[type] || toastClasses.info;

    const toastHTML = `
      <div class="toast ${toastClass} show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const newToastEl = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(newToastEl, { delay: 4000 });
    toast.show();

    // Remove from DOM after hiding
    newToastEl.addEventListener('hidden.bs.toast', () => {
      newToastEl.remove();
    });
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
  }

  // Make showToast globally available
  window.showToast = showToast;