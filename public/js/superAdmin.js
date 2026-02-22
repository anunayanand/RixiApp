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

    // Auto-close sidebar on mobile devices
    if (window.innerWidth <= 991) {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  });
});

function showSection(id) {
  // Hide all sections
  sections.forEach(sec => sec.style.display = 'none');

  // Show the target section
  const targetSection = document.getElementById(id);
  if (targetSection) targetSection.style.display = 'block';

  // Set active sidebar link if it exists
  const sidebarLink = document.querySelector(`.sidebar a[href="#${id}"]`);
  if (sidebarLink) {
    setActive(sidebarLink);
  }
  
  // Clear active button state when showing dashboard
  if (id === 'dashboard') {
    clearActiveButton();
  }
  
  // Set active button state for registration section
  if (id === 'registration') {
    setActiveButton('registrationButton');
  }

  // Auto-close sidebar on mobile devices
  if (window.innerWidth <= 991) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }
}

// Global function to set active sidebar link
function setActive(element) {
  if (!element) return;
  document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
  element.classList.add('active');
}

// Registration Button to open registration section
const registrationButton = document.getElementById('registrationButton');
if (registrationButton) {
  registrationButton.addEventListener('click', e => {
    e.preventDefault();
    showSection('registration');
    setActiveButton('registrationButton');
  });
}

// Notification Button
const notificationButton = document.getElementById('notificationButton');
if (notificationButton) {
  notificationButton.addEventListener('click', e => {
    // Notification doesn't navigate to a section, just clear active state from other buttons
    // or you can add specific behavior if needed
    clearActiveButton();
  });
}

// Function to set active button state
function setActiveButton(activeButtonId) {
  // Remove active class from all header buttons
  document.querySelectorAll('.main-content .btn-light').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.borderColor = '#000';
  });
  
  // Add active class to the clicked button
  const activeButton = document.getElementById(activeButtonId);
  if (activeButton) {
    activeButton.classList.add('active');
    activeButton.style.backgroundColor = '#ff6600';
    activeButton.style.borderColor = '#000000';
    activeButton.style.color = '#000000';
  }
}

// Function to clear active button state
function clearActiveButton() {
  document.querySelectorAll('.main-content .btn-light').forEach(btn => {
    btn.classList.remove('active');
    btn.style.backgroundColor = '';
    btn.style.borderColor = '#000';
    btn.style.color = '';
  });
}

// Offer Letter Button to open offerLetterMail section
const offerLetterButton = document.getElementById('offerLetterButton');
const offerLetterSidebarBtn = document.getElementById('offerLetterSidebarBtn');

function handleOfferLetterClick(e) {
  if(e) e.preventDefault();
  showSection('offerLetterMail');
}

if (offerLetterButton) offerLetterButton.addEventListener('click', handleOfferLetterClick);
if (offerLetterSidebarBtn) offerLetterSidebarBtn.addEventListener('click', handleOfferLetterClick);

// Completion Mail Button to open completionMail section
const completionMailButton = document.getElementById('completionMailButton');
const completionMailSidebarBtn = document.getElementById('completionMailSidebarBtn');

function handleCompletionMailClick(e) {
  if(e) e.preventDefault();
  showSection('completionMail');
  
  // Specific resetting for completion section
  const rows = document.getElementById('completionTable')?.querySelectorAll("tr[data-batch]");
  if (rows) rows.forEach(row => row.style.display = 'none');
  
  const addFiltersMessage = document.getElementById('addFiltersMessage');
  const noDataMessage = document.getElementById('noDataMessage');
  if (addFiltersMessage) addFiltersMessage.style.display = 'table-row';
  if (noDataMessage) noDataMessage.style.display = 'none';

  const batchFilter = document.getElementById('batchCompletion');
  const searchInput = document.getElementById('searchCompletion');
  if (batchFilter) batchFilter.value = 'all';
  if (searchInput) searchInput.value = '';
}

if (completionMailButton) completionMailButton.addEventListener('click', handleCompletionMailClick);
if (completionMailSidebarBtn) completionMailSidebarBtn.addEventListener('click', handleCompletionMailClick);
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

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

  // Run once on page load to hide all
  window.addEventListener('DOMContentLoaded', (event) => {
    filterByBatch();
  });


function applyInternFilters() {
  const batchFilter = document.getElementById("batchFilter").value.toLowerCase();
  const domainFilter = document.getElementById("domainFilter").value.toLowerCase();
  const durationFilter = document.getElementById("durationFilter").value;
  
  // Try both IDs because it might be internSearchInput or internSearch
  const searchInput = document.getElementById("internSearch") || document.getElementById("internSearchInput");
  const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const items = document.querySelectorAll("#viewInterns .intern-row");
  let visibleCountDesktop = 0;
  let visibleCountMobile = 0;

  items.forEach(item => {
    const rowBatch = item.dataset.batch ? item.dataset.batch.toLowerCase() : "";
    const rowDomain = item.dataset.domain ? item.dataset.domain.toLowerCase() : "";
    const rowDuration = item.dataset.duration || "";
    // Use data attributes for name/id if present, else fallback
    const name = item.dataset.name ? item.dataset.name.toLowerCase() : "";
    const internId = item.dataset.id ? item.dataset.id.toLowerCase() : "";

    const matchesBatch = (batchFilter === "all" || rowBatch === batchFilter);
    const matchesDomain = (domainFilter === "all" || rowDomain === domainFilter);
    const matchesDuration = (durationFilter === "all" || rowDuration === durationFilter);
    const matchesSearch = (name.includes(searchValue) || internId.includes(searchValue));

    const isVisible = matchesBatch && matchesDomain && matchesDuration && matchesSearch;
    item.style.display = isVisible ? "" : "none";

    if (isVisible) {
      if (item.tagName === 'TR') {
        visibleCountDesktop++;
        const serialNoEl = item.querySelector('.serial-no');
        if (serialNoEl) serialNoEl.textContent = visibleCountDesktop;
      } else {
        visibleCountMobile++;
      }
    }
  });

  const noResultDesktop = document.getElementById('noInternResult');
  const noResultMobile = document.getElementById('noInternResultMobile');
  if (noResultDesktop) noResultDesktop.style.display = visibleCountDesktop === 0 ? "flex" : "none";
  if (noResultMobile) noResultMobile.style.display = visibleCountMobile === 0 ? "flex" : "none";
}

function clearInternFilters() {
  document.getElementById("batchFilter").value = "all";
  document.getElementById("domainFilter").value = "all";
  document.getElementById("durationFilter").value = "all";
  const searchInput = document.getElementById("internSearch") || document.getElementById("internSearchInput");
  if (searchInput) searchInput.value = "";
  applyInternFilters();
}
  // Function to send mails

  // ✅ Toggle Select All
   // ==========================
// SuperAdmin JS
// ==========================

// Toggle Sidebar for Mobile
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    if (overlay) overlay.classList.toggle("active");
  });
}

if (overlay) {
  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  });
}

// ==========================
// Select All Checkbox
// ==========================
function toggleSelectAll(type) {
  let checkboxes = document.querySelectorAll("." + type + "Checkbox");
  let master = document.getElementById(
    "selectAll" + (type === "confirm" ? "Confirm" : "Completion")
  );
  checkboxes.forEach(cb => {
    if (cb.closest("tr").style.display !== "none") {
      cb.checked = master.checked;
    }
  });
}

// ==========================
// Apply Filters & Search
// ==========================
function applyFilters(type) {
  let statusFilter = document.getElementById(
    "filter" + (type === "confirm" ? "Confirm" : "Completion")
  ).value;
  let batchFilter = document.getElementById(
    "batch" + (type === "confirm" ? "Confirm" : "Completion")
  ).value;
  let searchTerm = document
    .getElementById(
      "search" + (type === "confirm" ? "Confirm" : "Completion")
    )
    .value.toLowerCase();

  document.querySelectorAll(`#${type}Table tr`).forEach(row => {
    let rowStatus = row.dataset.status;
    let rowBatch = row.dataset.batch;
    let rowName = row.dataset.name.toLowerCase();
    let rowEmail = row.dataset.email.toLowerCase();

    let matchStatus = statusFilter === "all" || rowStatus === statusFilter;
    let matchBatch = batchFilter === "all" || rowBatch === batchFilter;
    let matchSearch =
      !searchTerm || rowName.includes(searchTerm) || rowEmail.includes(searchTerm);

    row.style.display = matchStatus && matchBatch && matchSearch ? "" : "none";

    // Highlight sent mails green
    if (rowStatus === "sent") {
      row.style.backgroundColor = "#d4edda"; // green
    } else {
      row.style.backgroundColor = ""; // default white
    }
  });
}

// ==========================
// Clear Filters
// ==========================
function clearFilters(type) {
  document.getElementById("filter" + (type === "confirm" ? "Confirm" : "Completion")).value = "all";
  document.getElementById("batch" + (type === "confirm" ? "Confirm" : "Completion")).value = "all";
  document.getElementById("search" + (type === "confirm" ? "Confirm" : "Completion")).value = "";
  applyFilters(type);
}


async function sendMails(type) {
  const checkboxes = document.querySelectorAll("." + type + "Checkbox:checked");
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedIds.length === 0) {
    showToast("Please select at least one intern", "warning");
    return;
  }

  try {
    const response = await fetch(type === "confirm" ? "/send-confirmation-mail" : "/send-completion-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interns: selectedIds }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(`${data.sent} mails sent. ${data.failed} failed.`, data.failed > 0 ? "warning" : "success");
      console.log(`${type} mail results:`, data);
    } else {
      showToast(`Error: ${data.message}`, "error");
    }
  } catch (err) {
   console.error("Unexpected error while sending mails:", err);
   showToast("Unexpected error while sending mails. Check console.", "error");
 }
}

async function sendOfferLetterMails() {
  const checkboxes = document.querySelectorAll(".offerLetterCheckbox:checked");
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedIds.length === 0) {
    showToast("Please select at least one intern", "warning");
    return;
  }

  try {
    const response = await fetch("/send-offerletter-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interns: selectedIds }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(`${data.sent} mails sent. ${data.failed} failed.`, data.failed > 0 ? "warning" : "success");

      // Update the pending count (decrement by sent)
      const dot = document.getElementById('offerLetterDot');
      if (dot) {
        // Assume count decreases by sent
        // Since we don't have the exact count, if sent > 0, and if no more pending, hide dot
        // But to be simple, if data.sent > 0, check if there are still pending
        // For now, just update the table
      }

      // Update the table rows
      checkboxes.forEach(cb => {
        cb.disabled = true;
        cb.checked = false;
        const row = cb.closest('tr');
        row.dataset.status = 'sent';
        row.style.backgroundColor = '#d4edda';
      });

      updateMasterCheckbox('offerLetter');
      applyFilters('offerLetter'); // Reapply filters to hide sent rows if filter is notSent

      // Hide dot if no more pending checkboxes
      const remainingCheckboxes = document.querySelectorAll('.offerLetterCheckbox:not([disabled])');
      if (remainingCheckboxes.length === 0) {
        const dot = document.getElementById('offerLetterDot');
        if (dot) dot.style.display = 'none';
      }

    } else {
      showToast(`Error: ${data.message}`, "error");
    }
  } catch (err) {
   console.error("Unexpected error while sending mails:", err);
   showToast("Unexpected error while sending mails. Check console.", "error");
 }
}

// Add event listener for offerLetterForm
document.addEventListener('DOMContentLoaded', () => {
  const offerLetterForm = document.getElementById('offerLetterForm');
  if (offerLetterForm) {
    offerLetterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await sendOfferLetterMails();
    });
  }
});

// Completion Mail Functions
async function sendCompletionMails() {
  const checkboxes = document.querySelectorAll(".completionCheckbox:checked");
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedIds.length === 0) {
    showToast("Please select at least one intern", "warning");
    return;
  }

  // Show loader
  const loaderWrapper = document.getElementById("pageLoaderWrapper");
  if (loaderWrapper) {
    loaderWrapper.style.display = 'flex';
    loaderWrapper.classList.remove("hidden");
  }

  try {
    const response = await fetch("/send-completion-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interns: selectedIds }),
    });

    const data = await response.json();
    if (data.success) {
      showToast(`${data.sent} mails sent. ${data.failed} failed.`, data.failed > 0 ? "warning" : "success");

      // Remove rows instantly with fade-out effect
      checkboxes.forEach(cb => {
        const row = cb.closest('tr');
        row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(20px)';
        
        // Remove from DOM after animation
        setTimeout(() => {
          row.remove();
          // Update serial numbers for remaining rows
          updateSerialNumbers('completionTable');
        }, 300);
      });

      updateMasterCheckbox('completion');
      applyFilters('completion'); // Reapply filters if needed

      // Hide dot if no more pending checkboxes
      const remainingCheckboxes = document.querySelectorAll('.completionCheckbox:not([disabled])');
      if (remainingCheckboxes.length === 0) {
        const dot = document.getElementById('completionMailDot');
        if (dot) dot.style.display = 'none';
      }
    } else {
      showToast(`Error: ${data.message}`, "error");
    }
  } catch (err) {
    console.error("Unexpected error while sending completion mails:", err);
    showToast("Unexpected error while sending completion mails. Check console.", "error");
  } finally {
    // Hide loader
    if (loaderWrapper) {
      loaderWrapper.classList.add("hidden");
      setTimeout(() => (loaderWrapper.style.display = "none"), 600);
    }
  }
}

// Function to update serial numbers in a table
function updateSerialNumbers(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const rows = table.querySelectorAll('tr[data-batch]');
  let serialNo = 1;
  rows.forEach(row => {
    const serialCell = row.querySelector('.serial-no');
    if (serialCell) {
      serialCell.textContent = serialNo++;
    }
  });
}

// Add event listener for completionForm
document.addEventListener('DOMContentLoaded', () => {
  const completionForm = document.getElementById('completionForm');
  if (completionForm) {
    completionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await sendCompletionMails();
    });
  }
});

function updateRowColor(checkbox, type) {
  const row = checkbox.closest("tr");
  if (checkbox.checked) {
    row.classList.add("row-selected");
  } else {
    row.classList.remove("row-selected");
  }
}


function toggleSelectAll(type) {
  const table = document.getElementById(type + "Table");
  const rows = table.querySelectorAll("tr");
  const master = document.getElementById(
    type === "confirm" ? "selectAllConfirm" : type === "completion" ? "selectAllCompletion" : "selectAllOfferLetter"
  );

  // only check/uncheck checkboxes from visible rows
  rows.forEach(row => {
    if (row.style.display !== "none") {
      const cb = row.querySelector("input[type='checkbox']:not([disabled])");
      if (cb) {
        cb.checked = master.checked;
        updateRowColor(cb, type);
      }
    }
  });
}

function updateMasterCheckbox(type) {
  const table = document.getElementById(type + "Table");
  const rows = table.querySelectorAll("tr");
  const master = document.getElementById(
    type === "confirm" ? "selectAllConfirm" : type === "completion" ? "selectAllCompletion" : "selectAllOfferLetter"
  );

  if (!master) return;

  const visibleCheckboxes = Array.from(rows)
    .filter(row => row.style.display !== "none")
    .map(row => row.querySelector("input[type='checkbox']:not([disabled])"))
    .filter(cb => cb);

  master.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every(cb => cb.checked);
}

function applyFilters(type) {
  if (type === 'completion') {
    const batch = document.getElementById("batchCompletion").value;
    const search = document.getElementById("searchCompletion").value.toLowerCase();
    const rows = document.getElementById("completionTable").querySelectorAll("tr[data-batch]");
    const addFiltersMessage = document.getElementById("addFiltersMessage");
    const noDataMessage = document.getElementById("noDataMessage");

    let visibleIndex = 0;
    let hasVisibleRows = false;

    // Check if any filter is active (batch or search)
    const hasFilters = batch !== "all" || search !== "";

    rows.forEach(row => {
      const rowBatch = row.getAttribute("data-batch");
      const name = row.getAttribute("data-name");
      const email = row.getAttribute("data-email");

      const matchBatch = batch === "all" || rowBatch === batch;
      const matchSearch = !search || name.includes(search) || email.includes(search);

      const isVisible = matchBatch && matchSearch;
      row.style.display = isVisible ? "" : "none";

      if (isVisible) {
        visibleIndex++;
        row.querySelector('.serial-no').textContent = visibleIndex;
        hasVisibleRows = true;
      }
    });

    // Show/hide messages based on filter state
    if (addFiltersMessage) addFiltersMessage.style.display = hasFilters ? "none" : "table-row";
    if (noDataMessage) noDataMessage.style.display = (hasFilters && !hasVisibleRows) ? "table-row" : "none";

    // Reset master checkbox
    const master = document.getElementById("selectAllCompletion");
    if (master) master.checked = false;

    return;
  }

  // Original logic for other types (confirm, offerLetter)
  const filter = document.getElementById("filter" + capitalize(type)).value;
  const batch = document.getElementById("batch" + capitalize(type)).value;
  const search = document.getElementById("search" + capitalize(type)).value.toLowerCase();
  const rows = document.getElementById(type + "Table").querySelectorAll("tr");

  let visibleIndex = 0;

  rows.forEach(row => {
    const status = row.getAttribute("data-status");
    const rowBatch = row.getAttribute("data-batch");
    const name = row.getAttribute("data-name");
    const email = row.getAttribute("data-email");

    let visible = true;
    if (filter !== "all" && filter !== status) visible = false;
    if (batch !== "all" && batch !== rowBatch) visible = false;
    if (search && !name.includes(search) && !email.includes(search)) visible = false;

    row.style.display = visible ? "" : "none";

    // Update serial number for visible rows
    if (visible) {
      visibleIndex++;
      const serialCell = row.querySelector('.serial-no');
      if (serialCell) {
        serialCell.textContent = visibleIndex;
      }
    }
  });

  // reset master checkbox whenever filters or batch changes
  const master = document.getElementById(
    type === "confirm" ? "selectAllConfirm" : type === "completion" ? "selectAllCompletion" : "selectAllOfferLetter"
  );
  if (master) master.checked = false;
}

// ==========================
// Apply Filters for Completed/Certified Interns
// ==========================
function applyCompletedFilters() {
  const batchFilter = document.getElementById("batchFilterCompleted").value;
  const domainFilter = document.getElementById("domainFilterCompleted").value;
  const durationFilter = document.getElementById("durationFilterCompleted").value;
  const searchValue = document.getElementById("completedSearchInput").value.toLowerCase().trim();

  const rows = document.querySelectorAll("#completedInternTable .completed-intern-row");
  let visibleIndex = 0;

  rows.forEach(row => {
    const rowBatch = row.dataset.batch;
    const rowDomain = row.dataset.domain;
    const rowDuration = row.dataset.duration;
    const internId = row.querySelector('.intern-id').textContent.toLowerCase();

    const matchesBatch = batchFilter === "all" || rowBatch === batchFilter;
    const matchesDomain = domainFilter === "all" || rowDomain === domainFilter;
    const matchesDuration = durationFilter === "all" || rowDuration === durationFilter;
    const matchesSearch = !searchValue || internId.includes(searchValue);

    const isVisible = matchesBatch && matchesDomain && matchesDuration && matchesSearch;
    row.style.display = isVisible ? "" : "none";

    if (isVisible) {
      visibleIndex++;
      row.querySelector('.serial-no').textContent = visibleIndex;
    }
  });
}

// ==========================
// Clear Filters for Completed Interns
// ==========================
function clearCompletedFilters() {
  document.getElementById("batchFilterCompleted").value = "all";
  document.getElementById("domainFilterCompleted").value = "all";
  document.getElementById("durationFilterCompleted").value = "all";
  document.getElementById("completedSearchInput").value = "";
  applyCompletedFilters();
}

function clearFilters(type) {
  if (type === "completion") {
    document.getElementById("batchCompletion").value = "all";
    document.getElementById("searchCompletion").value = "";
    applyFilters("completion");
    return;
  }
  
  if (type === "offerLetter") {
    document.getElementById("filter" + capitalize(type)).value = "notSent";
  } else {
    document.getElementById("filter" + capitalize(type)).value = "all";
  }
  document.getElementById("batch" + capitalize(type)).value = "all";
  document.getElementById("search" + capitalize(type)).value = "";
  applyFilters(type);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
 

  // Calender 

  flatpickr("#meeting_datetime", {
    enableTime: true,        // enable time selection
    dateFormat: "Y-m-d H:i", // format for backend (YYYY-MM-DD HH:MM)
    altInput: true,          // show an alternative user-friendly input
    altFormat: "F j, Y at h:i K", // e.g. "October 14, 2026 at 2:30 PM"
    minDate: "today",        // optional: don't allow past dates
    time_24hr: false          // 12-hour format with AM/PM for user-friendly display
  });

  // Meeting Batch Filter

const batchFilter = document.getElementById('Meeting_batchFilter');
const tableBody = document.getElementById('meetingsTableBody');

  batchFilter.addEventListener('change', () => {
    const selectedBatch = batchFilter.value;
    Array.from(tableBody.rows).forEach(row => {
      if (selectedBatch === 'all' || row.dataset.batch === selectedBatch) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
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


  document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("ambassadorSearch");
  const clearButton = document.getElementById("clearFilter");
  const cards = document.querySelectorAll(".ambassador-card");

  function filterCards() {
    const query = searchInput.value.toLowerCase().trim();

    cards.forEach(card => {
      const nameEl = card.querySelector(".ambassador-name");
      const idEl = card.querySelector(".ambassador-id");

      const name = nameEl ? nameEl.textContent.toLowerCase().trim() : "";
      const id = idEl ? idEl.textContent.toLowerCase().trim() : "";

      // Show card if either name or ambassador_id includes search query
      card.style.display = (name.includes(query) || id.includes(query)) ? "block" : "none";
    });
  }

  searchInput.addEventListener("input", filterCards);

  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    cards.forEach(card => card.style.display = "block");
    searchInput.focus();
  });

  // Show all on page load
  cards.forEach(card => card.style.display = "block");
});



document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("notificationList");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const dot = document.getElementById("notificationDot");

  // ✅ Mark single notification as read
  list.addEventListener("click", async (e) => {
    if (e.target.classList.contains("mark-read-btn")) {
      const li = e.target.closest("li");
      const id = li.getAttribute("data-id");
      try {
        const res = await fetch(`/notification/read/${id}`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
          li.remove(); // remove notification from dropdown
          if (list.querySelectorAll("li[data-id]").length === 0) {
            list.innerHTML = '<li class="p-3 text-center text-muted">No new notifications 🎉</li>';
            if (dot) dot.style.display = "none";
          }
        }
      } catch (err) {
        console.error("Error removing notification", err);
      }
    }
  });

  // ✅ Clear all notifications
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch("/notification/clear", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          list.innerHTML = '<li class="p-3 text-center text-muted">No new notifications 🎉</li>';
          if (dot) dot.style.display = "none";
        }
      } catch (err) {
        console.error("Error clearing notifications", err);
      }
    });
  }

});

  function approveReject(id, action, btn) {
    const originalHTML = btn.innerHTML;

    // Show spinner
    btn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
    `;
    btn.disabled = true;

    // Disable the other button in the same row
    const row = btn.closest("tr");
    row.querySelectorAll("button").forEach(b => b.disabled = true);

    fetch(`/superAdmin/registration/${id}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Remove row after success
        row.remove();
        showToast(data.message, "success");
        // Update the registration counter
        const countSpan = document.getElementById('superRegCount');
        if (countSpan) {
          let count = parseInt(countSpan.textContent) - 1;
          if (count > 0) {
            countSpan.textContent = count;
          } else {
            const badge = document.getElementById('superRegBadge');
            if (badge) badge.style.display = 'none';
          }
        }
      } else {
       showToast(data.message || "Action failed", "error");

       // Restore buttons on failure
       row.querySelectorAll("button").forEach(b => {
         b.disabled = false;
         b.innerHTML = b === btn ? originalHTML : b.innerText;
       });
     }
    })
    .catch(err => {
      console.error(err);
      showToast("Server error", "error");

      // Restore buttons on error
      row.querySelectorAll("button").forEach(b => {
        b.disabled = false;
        b.innerHTML = b === btn ? originalHTML : b.innerText;
      });
    });
  }

// Heartbeat mechanism to detect disconnections
const HEARTBEAT_INTERVAL = 30000; // Send heartbeat every 30 seconds

// Send heartbeat to server
async function sendHeartbeat() {
  try {
    const response = await fetch('/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      console.error('Heartbeat failed:', response.status);
    }
  } catch (err) {
    console.error('Heartbeat error:', err);
  }
}

// Start heartbeat when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Send initial heartbeat
  sendHeartbeat();
  
  // Set up periodic heartbeat
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  
  // Send heartbeat before page unload
  window.addEventListener('beforeunload', () => {
    navigator.sendBeacon('/heartbeat', JSON.stringify({}));
  });
});