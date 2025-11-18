import { authService } from './authService.js';
import { journal } from './api.js';

// Journal page logic — uses backend API to persist entries
document.addEventListener('DOMContentLoaded', async () => {
  // Require authentication
  const user = authService.getUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  const entryField = document.getElementById('journalEntry');
  const wordCountEl = document.getElementById('wordCount');
  const searchField = document.getElementById('journalSearch');
  const moodFilter = document.getElementById('moodFilter');
  const saveBtn = document.getElementById('saveJournal');
  const moodSelect = document.getElementById('journalMood');

  // Live word count
  if (entryField) {
    entryField.addEventListener('input', () => {
      const count = entryField.value.trim().split(/\s+/).filter(w => w).length;
      wordCountEl.textContent = `Words: ${count}`;
    });
  }

  // Save journal to backend
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // Validate input
      const text = entryField.value.trim();
      if (!text) {
        showTempMessage('journalSavedMsg', 'Please write something before saving.', 2500);
        return;
      }

      // Get and validate mood
      const mood = moodSelect.value ? Number(moodSelect.value) : null;
      if (mood !== null && (isNaN(mood) || mood < 1 || mood > 5)) {
        showTempMessage('journalSavedMsg', 'Invalid mood value. Please select a valid mood.', 2500);
        return;
      }

      // Check authentication
      if (!authService.isAuthenticated()) {
        showTempMessage('journalSavedMsg', 'Please log in to save your journal.', 2500);
        window.location.href = '/index.html';
        return;
      }

      // Save to backend
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      try {
        // Create journal entry
        console.log('Saving journal entry:', { text, mood });
        await journal.create(text, mood);
        
        // Clear form
        entryField.value = '';
        moodSelect.value = '';
        wordCountEl.textContent = 'Words: 0';
        
        // Show success and refresh
        showTempMessage('journalSavedMsg', 'Journal saved ✓', 1800);
        await loadJournalHistory(searchField.value.trim(), moodFilter.value);
      } catch (err) {
        console.error('Failed to save journal:', err);
        
        // Handle different types of errors
        let errorMsg;
        if (err.message.includes('Authentication required')) {
          errorMsg = 'Please log in again to continue.';
          setTimeout(() => window.location.href = '/index.html', 2000);
        } else if (err.bodyText && err.bodyText.includes('<!DOCTYPE html>')) {
          errorMsg = 'Server error: API not responding correctly. Please try again.';
        } else {
          errorMsg = err.message || 'Failed to save journal. Please try again.';
        }
        
        showTempMessage('journalSavedMsg', errorMsg, 4000);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    });
  }

  // Filters
  if (searchField) searchField.addEventListener('input', () => loadJournalHistory(searchField.value.trim(), moodFilter.value));
  if (moodFilter) moodFilter.addEventListener('change', () => loadJournalHistory(searchField.value.trim(), moodFilter.value));

  // Initial load
  await loadJournalHistory();
});

// Load and render journal entries from backend
async function loadJournalHistory(filterText = '', filterMood = '') {
  try {
    const entries = await journal.getEntries();
    const container = document.getElementById('journalHistory');
    container.innerHTML = '';

    const filtered = entries.filter(e => {
      if (filterText && !e.entryText.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterMood && String(e.mood || '') !== String(filterMood)) return false;
      return true;
    });

    // render
    filtered.forEach((e, index) => {
      const moodTag = e.mood ? `<span class="entry-mood">${getMoodEmoji(e.mood)}</span>` : '';
      const div = document.createElement('div');
      div.className = 'journal-entry';
      if (e.mood) div.dataset.mood = e.mood;
      
      const entryId = `entry-${Date.now()}-${index}`;
      const isLongText = e.entryText.length > 300;
      const truncatedText = isLongText ? e.entryText.substring(0, 300) + '...' : e.entryText;
      
      div.innerHTML = `
        <div class="entry-header">
          <small>${new Date(e.entryDate).toLocaleString()}</small> ${moodTag}
        </div>
        <p id="${entryId}-text" class="entry-text">${escapeHtml(truncatedText)}</p>
        ${isLongText ? `
          <button id="${entryId}-toggle" class="show-more-btn" data-entry-id="${entryId}" data-full-text="${escapeHtmlForAttr(e.entryText)}" data-is-expanded="false">
            Show More
          </button>
        ` : ''}
      `;
      container.appendChild(div);
      
      // Attach event listener for Show More/Less button
      if (isLongText) {
        const toggleBtn = document.getElementById(`${entryId}-toggle`);
        toggleBtn.addEventListener('click', () => toggleEntryText(entryId, e.entryText));
      }
    });

    loadJournalMoodChart(entries);
  } catch (err) {
    console.error('Failed to load journal entries:', err);
    const msg = err.bodyText ? `Server error: ${err.bodyText.slice(0,200)}` : (err.message || 'Failed to load journal entries');
    showTempMessage('journalSavedMsg', msg, 4000);
  }
}

// Toggle Show More/Less for entries
function toggleEntryText(entryId, fullText) {
  const textEl = document.getElementById(`${entryId}-text`);
  const toggleBtn = document.getElementById(`${entryId}-toggle`);
  const isExpanded = toggleBtn.dataset.isExpanded === 'true';
  
  if (isExpanded) {
    // Collapse
    textEl.textContent = fullText.substring(0, 300) + '...';
    toggleBtn.textContent = 'Show More';
    toggleBtn.dataset.isExpanded = 'false';
  } else {
    // Expand
    textEl.textContent = fullText;
    toggleBtn.textContent = 'Show Less';
    toggleBtn.dataset.isExpanded = 'true';
  }
}

// Render mood trend chart from journal entries
let journalChart = null;
function loadJournalMoodChart(entries = []) {
  const ctxEl = document.getElementById('journalMoodChart');
  if (!ctxEl) return;

  const last = (entries || []).slice(-14);
  const labels = last.map(i => new Date(i.entryDate).toLocaleDateString());
  const data = last.map(i => Number(i.mood) || 3);
  const colors = data.map(m => {
    switch (m) { case 5: return '#FFD93D'; case 4: return '#6BCB77'; case 3: return '#FF6B6B'; case 2: return '#FF922B'; case 1: return '#4D96FF'; default: return '#2575fc'; }
  });

  if (!journalChart) {
    const ctx = ctxEl.getContext('2d');
    journalChart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Mood', data: [], fill: true }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: { line: { tension: 0.35 }, point: { radius: 5 } },
        scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  journalChart.data.labels = labels;
  journalChart.data.datasets[0].data = data;
  journalChart.data.datasets[0].pointBackgroundColor = colors;
  journalChart.data.datasets[0].borderColor = '#2575fc';
  journalChart.data.datasets[0].backgroundColor = 'rgba(37,117,252,0.18)';
  journalChart.update();
}

// Small helpers
function getMoodEmoji(mood) {
  switch (Number(mood)) { case 5: return '😊'; case 4: return '🙂'; case 3: return '😐'; case 2: return '😟'; case 1: return '☹️'; default: return ''; }
}

function showTempMessage(elId, text, ms = 1800) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; }, ms);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeHtmlForAttr(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
