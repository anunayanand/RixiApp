
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
