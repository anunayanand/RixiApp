
const sidebarLinks = document.querySelectorAll('.sidebar a[href^="#"]');
const sections = document.querySelectorAll('.main-content section');

// Initially show only dashboard
sections.forEach(sec => {
  sec.style.display = sec.id === 'dashboard' ? 'block' : 'none';
});

sidebarLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);

    // Hide all sections, including dashboard
    sections.forEach(sec => sec.style.display = 'none');

    // Show only the clicked section
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.style.display = 'block';
  });
});



  function toggleConfirmAll() {
    const checked = document.getElementById('selectAllConfirm').checked;
    document.querySelectorAll('.confirmCheckbox').forEach(c => c.checked = checked);
  }
  function toggleCongratsAll() {
    const checked = document.getElementById('selectAllCongrats').checked;
    document.querySelectorAll('.congratsCheckbox').forEach(c => c.checked = checked);
  }

function filterByBatch() {
    const selectedBatch = document.getElementById("batchFilter").value;
    const cards = document.querySelectorAll(".intern-card");

    cards.forEach(card => {
      if (selectedBatch === "all" || card.dataset.batch === selectedBatch) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }
function filterProjectsByBatch() {
  const selectedBatch = document.getElementById("projectBatchFilter").value.toLowerCase();
  const rows = document.querySelectorAll("#viewProjects .project-row");

  rows.forEach(row => {
    const rowBatch = row.getAttribute("data-batch").toLowerCase();
    row.style.display = (selectedBatch === "all" || rowBatch === selectedBatch) ? "" : "none";
  });
}





// Intern Filters for Table
function applyInternFilters() {
  let batchFilter = document.getElementById("batchFilter").value.toLowerCase();
  let internSearch = document.getElementById("internSearch").value.toLowerCase();
  let rows = document.querySelectorAll("#viewInterns .intern-row");

  rows.forEach(row => {
    let rowBatch = row.getAttribute("data-batch").toLowerCase();
    let internId = row.querySelector(".intern-id")?.textContent.toLowerCase() || "";

    let matchesBatch = (batchFilter === "all" || rowBatch === batchFilter);
    let matchesIntern = (internSearch === "" || internId.includes(internSearch));

    row.style.display = (matchesBatch && matchesIntern) ? "" : "none";
  });
}

function clearInternFilters() {
  document.getElementById("batchFilter").value = "all";
  document.getElementById("internSearch").value = "";
  applyInternFilters();
}



document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});


  // Run once on page load to hide all
  window.addEventListener('DOMContentLoaded', (event) => {
    filterByBatch();
    filterProjectsByBatch();
    filterSubmittedProjects('<%= currentSubmittedBatch %>');
  });


    // Helper to get the Submitted Projects section
function getSubmittedSection() {
  return document.getElementById('submittedProjects');
}

// Main filter function
function applySubmittedFilters() {
  const section = getSubmittedSection();
  if (!section) return;

  const batchFilter = section.querySelector('#submittedBatchFilter')?.value.toLowerCase() || 'all';
  const internSearch = section.querySelector('#submittedInternSearch')?.value.toLowerCase().trim() || '';

  const cards = section.querySelectorAll('.intern-card');

  cards.forEach(card => {
    const cardBatch = (card.dataset.batch || '').toLowerCase();
    const cardInternId = (card.querySelector('.intern-id')?.textContent || '').toLowerCase().trim();

    const matchesBatch = (batchFilter === 'all' || cardBatch === batchFilter);
    const matchesIntern = (internSearch === '' || cardInternId.includes(internSearch));

    // Show card only if both match
    card.style.display = (matchesBatch && matchesIntern) ? 'block' : 'none';
  });
}

// Clear filters
function clearSubmittedFilters() {
  const section = getSubmittedSection();
  if (!section) return;

  section.querySelector('#submittedBatchFilter').value = 'all';
  section.querySelector('#submittedInternSearch').value = '';
  applySubmittedFilters();
}

// Apply filters on page load
window.addEventListener('DOMContentLoaded', () => {
  applySubmittedFilters(); // ensures all cards are visible by default
});

  // document.addEventListener('DOMContentLoaded', applySubmittedFilters);

  (() => {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }

        form.classList.add('was-validated')
      }, false)
    })
  })()

// Filters
function applyAttendanceFilters() {
  const batch = document.getElementById('attendanceBatchFilter').value.toLowerCase();
  const week = document.getElementById('attendanceWeekFilter').value.toLowerCase();
  const search = document.getElementById('attendanceSearch').value.toLowerCase().trim();

  document.querySelectorAll('#attendanceTable tbody .attendance-row').forEach(row => {
    const rowBatch = row.dataset.batch.toLowerCase();
    const rowWeek = row.dataset.week.toLowerCase();
    const rowIntern = row.dataset.intern.toLowerCase();
    const rowName = row.children[1].textContent.toLowerCase();

    const matches = 
      (batch==='all' || batch===rowBatch) &&
      (week==='all' || week===rowWeek) &&
      (search==='' || rowIntern.includes(search) || rowName.includes(search));

    row.style.display = matches ? 'table-row' : 'none';
  });
}

function clearAttendanceFilters() {
  document.getElementById('attendanceBatchFilter').value = 'all';
  document.getElementById('attendanceWeekFilter').value = 'all';
  document.getElementById('attendanceSearch').value = '';
  applyAttendanceFilters();
}

// Select All checkbox
function toggleSelectAll(master) {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(cb => cb.checked = master.checked);
}

// Populate bulk form and submit
document.getElementById('bulkAttendanceForm').addEventListener('submit', function(e){
  e.preventDefault();
  const selected = [];
  document.querySelectorAll('.row-checkbox:checked').forEach(cb => {
    selected.push({ userId: cb.dataset.user, meetingId: cb.dataset.meeting });
  });

  if(selected.length===0){
    alert('Select at least one intern!');
    return;
  }

  document.getElementById('bulkInternsInput').value = JSON.stringify(selected);
  this.submit(); // submit normal form
});


// Image Preview
const imageInput = document.getElementById('imageInput');
  const previewImage = document.getElementById('previewImage');

  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = function(e){
        previewImage.src = e.target.result;
      }
      reader.readAsDataURL(file);
    }
  });



// Disable left-click
document.addEventListener("contextmenu", function(e) {
  e.preventDefault(); // block right-click
  // alert("Right-click is disabled!");
});


document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("notificationList");
  const markAllBtn = document.getElementById("markAllBtn");
  const dot = document.getElementById("notificationDot");

  // ✅ Mark single notification as read
  list.addEventListener("click", async (e) => {
    if (e.target.classList.contains("mark-as-read")) {
      const li = e.target.closest("li");
      const notificationId = li.getAttribute("data-id");

      const res = await fetch(`/notification/read/${notificationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        li.remove();
        if (list.querySelectorAll("li[data-id]").length === 0) {
          list.innerHTML = '<li class="p-3 text-center text-muted">No new notifications 🎉</li>';
          if (dot) dot.style.display = "none";
        }
      }
    }
  });

  // ✅ Mark all as read
  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      const res = await fetch("/notification/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        list.innerHTML = '<li class="p-3 text-center text-muted">No new notifications 🎉</li>';
        if (dot) dot.style.display = "none";
      }
    });
  }
});
// Function to update project status with loader + flash-style toasts
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll('form[action="/admin/projects/update-status"]');

  forms.forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userId = form.querySelector('input[name="userId"]').value;
      const projectId = form.querySelector('input[name="projectId"]').value;
      const status = form.querySelector('select[name="status"]').value;

      const btn = form.querySelector('button[type="submit"]');
      const originalHTML = btn.innerHTML;
      btn.disabled = true;

      // Add loader inside the button
      btn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      `;

      try {
        const res = await fetch("/admin/projects/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, projectId, status })
        });

        const data = await res.json();

        // Restore button
        btn.disabled = false;
        btn.innerHTML = originalHTML;

        const badge = form.closest("tr").querySelector(".badge");

        if (data.success) {
          badge.textContent = status;
          badge.classList.remove("badge-approved", "badge-rejected", "badge-pending");

          if (status === "accepted") badge.classList.add("badge-approved");
          else if (status === "rejected") badge.classList.add("badge-rejected");
          else badge.classList.add("badge-pending");

          showFlashToast(data.message, "success");
        } else {
          showFlashToast(data.message, "error");
        }

      } catch (err) {
        console.error("🔥 Error:", err);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        showFlashToast("Error updating project status", "error");
      }
    });
  });

  // 👇 Flash-style toast (matches req.flash styling)
  function showFlashToast(message, type) {
    // Find or create the toast container (top-right)
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container position-fixed top-0 end-0 p-3";
      container.style.zIndex = 2000;
      document.body.appendChild(container);
    }

    // Choose background color class (like your flash)
    const bgClass =
      type === "success" ? "text-bg-success" :
      type === "error" ? "text-bg-danger" :
      "text-bg-info";

    // Create toast element
    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center ${bgClass} border-0 mb-2`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);

    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();

    // Remove from DOM when hidden
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  }
});

function showAcceptToast(message, type) {
  let container = document.getElementById("accept-toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "accept-toast-container";
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = 3000;
    document.body.appendChild(container);
  }

  const bgClass =
    type === "success" ? "text-bg-success" :
    type === "error" ? "text-bg-danger" :
    "text-bg-info";

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center ${bgClass} border-0 mb-2`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button"
        class="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast"
        aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();

  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

async function acceptRegistration(id, btn) {
  const row = btn.closest('tr');
  const internId = row.querySelector('.intern-id-input').value.trim();
  const batchNo = row.querySelector('.batch-input').value.trim();

  if (!internId || !batchNo) {
    showAcceptToast('Intern ID and Batch are required', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>';

  try {
    const response = await fetch(`/admin/accept-registration/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intern_id: internId, batch_no: batchNo })
    });
    const data = await response.json();
    // console.log('Response data:', data);
    if (data.success) {
      showAcceptToast(data.message, "success");
       btn.innerHTML = 'Accepted';
       row.remove();
      // location.reload(); // Reload to update the table
    } else {
      showAcceptToast(data.message, "error");
      btn.disabled = false;
      btn.innerHTML = 'Accept';
    }
  } catch (error) {
    // console.error('Error:', error);
    showAcceptToast('An error occurred', 'error');
    btn.disabled = false;
    btn.innerHTML = 'Accept';
  }
}
