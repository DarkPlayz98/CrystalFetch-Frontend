let selectedFormat = "mp4";

// Put your Railway backend URL here
const API_BASE = "https://crystalfetch-backend.onrender.com";

const urlInput = document.getElementById("urlInput");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const downloadLink = document.getElementById("downloadLink");
const formatButtons = document.querySelectorAll(".format-btn");

formatButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    formatButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedFormat = btn.dataset.format;
  });
});

fetchBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();

  if (!url) {
    setStatus("Paste a direct media URL first.");
    return;
  }

  downloadLink.classList.add("hidden");
  progressBar.style.width = "15%";
  setStatus("Submitting job...");

  try {
    const res = await fetch(`${API_BASE}/api/job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        format: selectedFormat
      })
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to start job");
    }

    const jobId = data.job_id;
    setStatus("Working...");
    progressBar.style.width = "35%";
    pollJob(jobId);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
    progressBar.style.width = "0%";
  }
});

async function pollJob(jobId) {
  const timer = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/job/${jobId}`);
      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Job not found");
      }

      if (data.status === "queued") {
        setStatus("Queued...");
        progressBar.style.width = "25%";
      } else if (data.status === "processing") {
        setStatus(data.message || "Processing...");
        progressBar.style.width = "65%";
      } else if (data.status === "done") {
        clearInterval(timer);
        setStatus("Ready.");
        progressBar.style.width = "100%";

        const fileUrl = `${API_BASE}${data.download_url}`;
        downloadLink.href = fileUrl;
        downloadLink.download = data.filename || "CrystalFetch.file";
        downloadLink.textContent = "Download file";
        downloadLink.classList.remove("hidden");
      } else if (data.status === "error") {
        clearInterval(timer);
        setStatus(`Error: ${data.message}`);
        progressBar.style.width = "0%";
      }
    } catch (err) {
      clearInterval(timer);
      setStatus(`Error: ${err.message}`);
      progressBar.style.width = "0%";
    }
  }, 2000);
}

function setStatus(text) {
  statusText.textContent = text;
}