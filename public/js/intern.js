document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".meeting-time").forEach((el) => {
    const rawTime = el.dataset.time;
    if (!rawTime) {
      el.textContent = "N/A";
      return;
    }

    const date = new Date(rawTime);
    const formatted = date
      .toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace("am", "AM")
      .replace("pm", "PM");

    el.textContent = formatted;
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
      sections.forEach((s) => s.classList.remove("active"));
      const target = this.getAttribute("href").substring(1);
      document.getElementById(target).classList.add("active");
    });
  });
});

let showDetailsBtn = document.getElementById("showDetails");
let detailsSection = document.querySelector(".details");
let detailsVisible = false;
showDetailsBtn.addEventListener("click", function () {
  detailsVisible = !detailsVisible;
  if (detailsVisible) {
    detailsSection.style.display = "block";
    showDetailsBtn.innerHTML = '<i class="bi bi-arrow-up-square-fill"></i>';
  } else {
    detailsSection.style.display = "none";
    showDetailsBtn.innerHTML = '<i class="bi bi-arrow-down-square-fill"></i>';
  }
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


// Notification Handling
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
          list.innerHTML = '<li class="p-3 text-center text-muted">No new notifications</li>';
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
