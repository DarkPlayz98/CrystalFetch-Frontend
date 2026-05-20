let selectedFormat = "mp4";

// Put your RENDER backend URL here (Make sure there is no slash at the very end)
const API_BASE = "https://crystalfetch-backend.onrender.com"; 

const urlInput = document.getElementById("urlInput");
const fetchBtn = document.getElementById("fetchBtn");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const downloadLink = document.getElementById("downloadLink");
const formatButtons = document.querySelectorAll(".format-btn");

// Prevent empty clicks
downloadLink.removeAttribute("href");
downloadLink.removeAttribute("download");
downloadLink.addEventListener("click", (e) => {
  if (!downloadLink.getAttribute("href")) e.preventDefault();
});

formatButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (fetchBtn.disabled) return; 
    formatButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedFormat = btn.dataset.format;
  });
});

urlInput.addEventListener("input", () => {
  if (!downloadLink.classList.contains("hidden")) {
    downloadLink.classList.add("hidden");
    downloadLink.removeAttribute("href");
    progressBar.style.width = "0%";
    setStatus("Waiting for URL...", false);
  }
});

fetchBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();

  if (!url) {
    setStatus("Paste a media URL first.", true);
    return;
  }

  setUIState(true);
  downloadLink.classList.add("hidden");
  downloadLink.removeAttribute("href");
  progressBar.style.width = "10%";
  setStatus("Connecting to server...", false);

  try {
    const res = await fetch(`${API_BASE}/api/job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, format: selectedFormat })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed to start job");

    progressBar.style.width = "25%";
    pollJob(data.job_id);

  } catch (err) {
    setStatus(err.message, true);
    progressBar.style.width = "0%";
    setUIState(false);
  }
});

async function pollJob(jobId) {
  const timer = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/job/${jobId}`);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Job not found");

      if (data.status === "queued") {
        setStatus("Queued in server...", false);
        progressBar.style.width = "40%";
      } 
      else if (data.status === "processing") {
        setStatus(data.message || "Processing media...", false);
        progressBar.style.width = "75%";
      } 
      else if (data.status === "done") {
        clearInterval(timer);
        setStatus(data.message, false);
        progressBar.style.width = "100%";

        const fileUrl = `${API_BASE}${data.download_url}?download=true`;
        downloadLink.href = fileUrl;
        downloadLink.setAttribute("download", data.filename || `CrystalFetch.${selectedFormat}`);
        
        downloadLink.classList.remove("hidden");
        setUIState(false); 
      } 
      else if (data.status === "error") {
        clearInterval(timer);
        setStatus(data.message, true);
        progressBar.style.width = "0%";
        setUIState(false); 
      }
    } catch (err) {
      clearInterval(timer);
      setStatus("Lost connection to server.", true);
      progressBar.style.width = "0%";
      setUIState(false); 
    }
  }, 2000);
}

function setStatus(text, isError) {
  statusText.textContent = text;
  if (isError) statusText.classList.add("danger-text");
  else statusText.classList.remove("danger-text");
}

function setUIState(isProcessing) {
  fetchBtn.disabled = isProcessing;
  urlInput.disabled = isProcessing;
  fetchBtn.textContent = isProcessing ? "Processing..." : "Fetch Media";
}
