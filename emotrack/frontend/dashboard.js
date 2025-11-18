import { authService } from './js/authService.js';
import { emotions, journal } from './js/api.js';

// ---------- Dashboard behavior ----------
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const user = authService.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const welcomeText = document.getElementById("welcomeText");
  const logoutBtn = document.getElementById("logoutBtn");
  welcomeText.textContent = `Hello, ${user.name}`;

  logoutBtn.addEventListener("click", () => {
    authService.logout();
  });

  // Mood buttons
  const moodButtons = document.querySelectorAll(".mood-btn");
  let selectedMood = null;
  moodButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      moodButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedMood = parseInt(btn.dataset.mood,10);
    });
  });

  // Submit mood
  document.getElementById("submitMood").addEventListener("click", async () => {
    if (!selectedMood) {
      showTempMessage("moodSavedMsg", "Please select a mood first.", 2500);
      return;
    }

    try {
      const journalEntry = document.getElementById("journalEntry").value.trim();
      
      // Save mood to emotions
      await emotions.create(selectedMood, "");
      showTempMessage("moodSavedMsg", "Mood saved ✓", 1800);
      
      // If there's a journal entry, save it separately
      if (journalEntry) {
        await journal.create(journalEntry, selectedMood);
        document.getElementById("journalEntry").value = "";
        showTempMessage("journalSavedMsg", "Journal saved ✓", 1800);
      }
      
      selectedMood = null;
      moodButtons.forEach(b => b.classList.remove("selected"));
      
      // Refresh data
      await Promise.all([
        loadMoodHistory(),
        loadJournalHistory(),
        updateStats()
      ]);
    } catch (error) {
      showTempMessage("moodSavedMsg", "Failed to save: " + error.message, 2500);
    }
  });

  // Initialize chart and load data
  initChart();
  Promise.all([
    loadMoodHistory(),
    loadJournalHistory(),
    updateStats()
  ]).catch(error => {
    console.error('Error loading dashboard data:', error);
    showTempMessage("moodSavedMsg", "Error loading dashboard data", 2500);
  });

  // Dark mode toggle with persistence
  const darkToggle = document.querySelector(".dark-toggle");
  
  // Load dark mode preference
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }
  
  // Toggle dark mode
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isNowDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isNowDark);
  });

  // Chatbot toggle
  document.getElementById("chatToggleBtn").addEventListener("click", ()=>{
    document.getElementById("chatbotContainer").style.display="flex";
  });
  document.getElementById("closeChat").addEventListener("click", ()=>{
    document.getElementById("chatbotContainer").style.display="none";
  });
  // Setup chat functionality if elements exist
  const sendMessageBtn = document.getElementById("sendMessage");
  const userMessageInput = document.getElementById("userMessage");
  
  if (sendMessageBtn) {
    sendMessageBtn.addEventListener("click", sendChatMessage);
  }
  
  if (userMessageInput) {
    userMessageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }
});

// Defensive: ensure DOM elements for chatbot exist before binding toggles when script loaded early
function safeQuery(id) {
  return document.getElementById(id) || null;
}

// Bind chatbot buttons only if present (script may run as module before DOM complete in some environments)
const _chatToggle = safeQuery('chatToggleBtn');
const _chatbotContainer = safeQuery('chatbotContainer');
const _closeChat = safeQuery('closeChat');
if (_chatToggle && _chatbotContainer) {
  _chatToggle.addEventListener('click', () => { _chatbotContainer.style.display = _chatbotContainer.style.display === 'flex' ? 'none' : 'flex'; });
}
if (_closeChat && _chatbotContainer) {
  _closeChat.addEventListener('click', () => { _chatbotContainer.style.display = 'none'; });
}

// ---------- Helpers ----------
function showTempMessage(elId, text, ms = 1800) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  setTimeout(() => { el.textContent = ""; }, ms);
}

// ---------- Chart ----------
let moodChart=null;
function initChart(){
  const ctx=document.getElementById("moodChart").getContext("2d");
  moodChart=new Chart(ctx,{type:'line',data:{labels:[],datasets:[{label:'Mood (1-5)',data:[],fill:true}]},options:{responsive:true,maintainAspectRatio:false,elements:{line:{tension:0.35},point:{radius:5}},scales:{y:{min:1,max:5,ticks:{stepSize:1}}},plugins:{legend:{display:false}}}});
}
async function loadMoodHistory() {
  try {
    const emotionData = await emotions.getHistory();
    
    const last14Entries = emotionData.slice(-14);
    const labels = last14Entries.map(entry => 
      new Date(entry.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    );

    const data = last14Entries.map(entry => entry.moodScore);
    
    const colors = last14Entries.map(entry => {
      switch (entry.moodScore) {
        case 5: return '#FFD93D';  // Happy
        case 4: return '#6BCB77';  // Good
        case 3: return '#FF6B6B';  // Neutral
        case 2: return '#FF922B';  // Worried
        case 1: return '#4D96FF';  // Sad
        default: return '#2575fc';
      }
    });

    moodChart.data.labels = labels;
    moodChart.data.datasets[0].data = data;
    moodChart.data.datasets[0].pointBackgroundColor = colors;
    moodChart.data.datasets[0].borderColor = '#2575fc';
    moodChart.data.datasets[0].backgroundColor = 'rgba(37,117,252,0.18)';
    moodChart.update();
  } catch (error) {
    console.error('Failed to load mood history:', error);
    showTempMessage("moodSavedMsg", "Failed to load mood history", 2500);
  }
}

// ---------- Journal history ----------
async function loadJournalHistory() {
  try {
    const journalEntries = await journal.getEntries();
    const container = document.getElementById("journalHistory");
    container.innerHTML = "";

    // Display journal entries with mood emojis
    journalEntries.forEach(entry => {
      const moodEmoji = getMoodEmoji(entry.mood);
      const el = document.createElement("div");
      el.innerHTML = `
        <small>${new Date(entry.entryDate).toLocaleString()} ${moodEmoji}</small>
        <p>${entry.entryText}</p>
      `;
      container.appendChild(el);
    });
  } catch (error) {
    console.error('Failed to load journal history:', error);
    showTempMessage("journalSavedMsg", "Failed to load journal entries", 2500);
  }
}

// Helper function to get mood emoji
function getMoodEmoji(moodScore) {
  switch (moodScore) {
    case 5: return '😊';  // Happy
    case 4: return '🙂';  // Good
    case 3: return '😐';  // Neutral
    case 2: return '😟';  // Worried
    case 1: return '☹️';  // Sad
    default: return '';
  }
}

// ---------- Stats ----------
async function updateStats() {
  try {
    const stats = await emotions.getStats();
    document.getElementById("statEntries").textContent = stats.totalEntries;
    document.getElementById("statAvg").textContent = stats.averageMood;
  } catch (error) {
    console.error('Failed to load stats:', error);
    showTempMessage("statEntries", "Failed to load statistics", 2500);
  }
}

// ---------- Chatbot functions (untouched) ----------

