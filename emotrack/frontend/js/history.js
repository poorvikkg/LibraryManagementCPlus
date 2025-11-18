import { journal } from './api.js';

const searchField = document.getElementById('journalSearch');
const moodFilter = document.getElementById('moodFilter');
const dateRange = document.getElementById('dateRange');
const tbody = document.getElementById('journalHistoryTable');
const chartCanvas = document.getElementById('historyMoodChart');

let sortOrder = { column: 'date', asc: false };

searchField.addEventListener('input', loadJournalHistoryFromServer);
moodFilter.addEventListener('change', loadJournalHistoryFromServer);
dateRange.addEventListener('change', loadJournalHistoryFromServer);
document.querySelectorAll('th[data-sort]').forEach(th => th.addEventListener('click', () => {
  const col = th.dataset.sort;
  sortOrder.asc = sortOrder.column === col ? !sortOrder.asc : true;
  sortOrder.column = col;
  loadJournalHistoryFromServer();
}));

document.getElementById('exportJournalCSV').addEventListener('click', exportJournalCSV);
document.getElementById('exportMoodCSV').addEventListener('click', exportMoodCSV);

let chartInstance = null;

// Map backend journal model to frontend entry
function mapJournalToEntry(e) {
  return {
    _id: e._id,
    date: e.entryDate || e.date || e.createdAt || new Date().toISOString(),
    mood: e.mood ?? e.moodScore ?? null,
    text: e.entryText ?? e.journalEntry ?? ''
  };
}

async function loadJournalHistoryFromServer() {
  tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
  try {
    const data = await journal.getEntries();
    const entries = (data || []).map(mapJournalToEntry).reverse();

    const q = (searchField.value || '').trim().toLowerCase();
    const moodVal = moodFilter.value;
    let filtered = entries.filter(j => {
      const textMatch = !q || (j.text || '').toLowerCase().includes(q);
      const moodMatch = !moodVal || String(j.mood) === String(moodVal);
      let dateMatch = true;
      if ((dateRange.value || '').includes('to')) {
        let [start, end] = dateRange.value.split('to').map(s => s.trim());
        if (start) dateMatch = new Date(j.date) >= new Date(start);
        if (end) dateMatch = dateMatch && (new Date(j.date) <= new Date(end));
      }
      return textMatch && moodMatch && dateMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortOrder.column === 'date') return sortOrder.asc ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
      if (sortOrder.column === 'mood') return sortOrder.asc ? (a.mood || 0) - (b.mood || 0) : (b.mood || 0) - (a.mood || 0);
      return 0;
    });

  // Render table
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No journal entries found.</td></tr>';
      return;
    }

    filtered.forEach((j, index) => {
      const tr = document.createElement('tr');
      const moodEmoji = j.mood ? getMoodEmoji(j.mood) : '';
      
      const entryId = `entry-${Date.now()}-${index}`;
      const isLongText = j.text.length > 200;
      const truncatedText = isLongText ? j.text.substring(0, 200) + '...' : j.text;
      
      tr.innerHTML = `
        <td>${new Date(j.date).toLocaleString()}</td>
        <td class="mood-${j.mood}">${moodEmoji}</td>
        <td>
          <div id="${entryId}-content" class="entry-content">
            <span id="${entryId}-text">${escapeHtml(truncatedText)}</span>
            ${isLongText ? `
              <button id="${entryId}-toggle" class="toggle-text-btn" data-entry-id="${entryId}" data-is-expanded="false">
                Show More
              </button>
            ` : ''}
          </div>
        </td>
        <td>
          <button class="action-btn delete-btn" data-entry-id="${j._id}" title="Delete this entry">
            🗑️ Delete
          </button>
        </td>
      `;
      tbody.appendChild(tr);
      
      // Attach event listener for Show More/Less button
      if (isLongText) {
        const toggleBtn = document.getElementById(`${entryId}-toggle`);
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleEntryText(entryId, j.text);
        });
      }
      
      // Attach event listener for Delete button
      const deleteBtn = tr.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteEntry(j._id, tr));
    });

  } catch (err) {
    console.error('Failed to load journal history from server', err);
    tbody.innerHTML = `<tr><td colspan="4">Error loading data: ${escapeHtml(err.message || String(err))}</td></tr>`;
  }
}

async function loadMoodHistoryChartFromServer() {
  try {
    // For journal moods we show a pie chart of mood distribution (last 30 entries)
    const data = await journal.getEntries();
    const entries = (data || []).map(mapJournalToEntry).slice(-30);

    // Count moods 1..5
    const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    entries.forEach(e => {
      const m = String(e.mood || '');
      if (counts[m] !== undefined) counts[m] += 1;
    });

    const labels = ['Sad (1)', 'Worried (2)', 'Neutral (3)', 'Good (4)', 'Happy (5)'];
    const dataPoints = [counts['1'], counts['2'], counts['3'], counts['4'], counts['5']];
    const colors = ['#4D96FF', '#FF922B', '#FF6B6B', '#6BCB77', '#FFD93D'];

    if (chartInstance) chartInstance.destroy();
    const ctx = chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: dataPoints, backgroundColor: colors }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  } catch (err) {
    console.error('Failed to load mood history chart', err);
  }
}

function getMoodEmoji(mood) { switch (Number(mood)) { case 5: return '😊'; case 4: return '🙂'; case 3: return '😐'; case 2: return '😟'; case 1: return '☹️'; default: return ''; } }
function escapeHtml(unsafe) { return (unsafe || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;'); }

function toggleEntryText(entryId, fullText) {
  const textEl = document.getElementById(`${entryId}-text`);
  const toggleBtn = document.getElementById(`${entryId}-toggle`);
  const isExpanded = toggleBtn.dataset.isExpanded === 'true';
  
  if (isExpanded) {
    // Collapse
    textEl.innerHTML = escapeHtml(fullText.substring(0, 200)) + '...';
    toggleBtn.textContent = 'Show More';
    toggleBtn.dataset.isExpanded = 'false';
  } else {
    // Expand
    textEl.innerHTML = escapeHtml(fullText);
    toggleBtn.textContent = 'Show Less';
    toggleBtn.dataset.isExpanded = 'true';
  }
}

async function deleteEntry(entryId, rowElement) {
  // Confirm delete
  if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
    return;
  }

  try {
    // Call backend delete endpoint
    await journal.deleteEntry(entryId);
    
    // Remove row from table with animation
    rowElement.style.opacity = '0';
    rowElement.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      rowElement.remove();
      
      // Check if table is now empty
      if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No journal entries found.</td></tr>';
      }
    }, 300);
    
    console.log('Journal entry deleted:', entryId);
  } catch (err) {
    console.error('Failed to delete journal entry:', err);
    alert('Failed to delete journal entry: ' + (err.message || 'Unknown error'));
  }
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  link.click();
}

function exportJournalCSV() {
  journal.getEntries().then(data => {
    const rows = (data || []).map(e => mapJournalToEntry(e));
    let csv = 'Date,Mood,Text\n';
    rows.forEach(j => { csv += `"${new Date(j.date).toLocaleString()}","${getMoodEmoji(j.mood)}","${(j.text || '').replace(/"/g,'""')}"\n`; });
    downloadCSV(csv, 'journal_history.csv');
  }).catch(err => alert('Export failed: ' + (err.message || err)));
}

function exportMoodCSV() {
  journal.getEntries().then(data => {
    const rows = (data || []).map(e => mapJournalToEntry(e));
    let csv = 'Date,Mood\n';
    rows.forEach(m => { csv += `"${new Date(m.date).toLocaleDateString()}","${m.mood}"\n`; });
    downloadCSV(csv, 'mood_history.csv');
  }).catch(err => alert('Export failed: ' + (err.message || err)));
}

// initial
loadJournalHistoryFromServer();
loadMoodHistoryChartFromServer();
