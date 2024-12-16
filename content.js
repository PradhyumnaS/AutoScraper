let isScrapingMode = false;
let scrapedData = [];
let currentElement = null;

function cleanText(text) {
  // Remove extra whitespaces, newlines, and trim
  return text.replace(/\s+/g, ' ').trim();
}

function extractTableData(element) {
  // Specifically handle table data extraction
  if (element.tagName.toLowerCase() === 'table') {
    const rows = [];
    const tableRows = element.querySelectorAll('tr');
    
    tableRows.forEach(row => {
      const rowData = [];
      const cells = row.querySelectorAll('td, th');
      
      cells.forEach(cell => {
        rowData.push(cleanText(cell.textContent));
      });
      
      // Only add non-empty rows
      if (rowData.some(cell => cell.length > 0)) {
        rows.push(rowData);
      }
    });
    
    return rows;
  }
  
  // Fallback to text content for non-table elements
  return cleanText(element.textContent);
}

function generateCSV(data) {
  if (data.length === 0) {
    console.error('No data to export');
    return null;
  }

  try {
    // Check if data is a 2D array (from table)
    if (Array.isArray(data[0]) && Array.isArray(data[0][0])) {
      // Flatten 2D table data
      return data.map(row => 
        row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"` // Escape quotes
        ).join(',')
      ).join('\n');
    }
    
    // Handle simple text data
    return data.map(item => 
      `"${String(item).replace(/"/g, '""')}"` 
    ).join('\n');
  } catch (error) {
    console.error('CSV generation error:', error);
    return null;
  }
}

// Event listener for scraping
document.addEventListener('click', (event) => {
  if (!isScrapingMode) return;

  event.preventDefault();
  event.stopPropagation();

  const extractedData = extractTableData(event.target);
  
  // Accumulate data, handling both table and non-table scenarios
  if (extractedData) {
    if (Array.isArray(extractedData[0])) {
      // If it's a table, add each row
      scrapedData.push(...extractedData);
    } else {
      // If it's text, add as single item
      scrapedData.push(extractedData);
    }
    
    // Visual feedback
    event.target.style.backgroundColor = 'lightgreen';
    setTimeout(() => {
      event.target.style.backgroundColor = '';
    }, 500);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startScraping') {
    isScrapingMode = true;
    scrapedData = []; // Reset scraped data
    alert('Scraping mode activated! Click on tables or elements to scrape.');
  }

  if (request.action === 'exportData') {
    const csvContent = generateCSV(scrapedData);
    
    if (csvContent) {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvUrl = URL.createObjectURL(blob);

      chrome.runtime.sendMessage({
        action: 'downloadCSV', 
        csvUrl: csvUrl
      }, (response) => {
        if (response && response.status === 'success') {
          alert(`Exported ${scrapedData.length} items to CSV`);
        } else {
          alert('CSV download failed. Check browser console.');
        }
      });
    } else {
      alert('No data to export');
    }
  }
});