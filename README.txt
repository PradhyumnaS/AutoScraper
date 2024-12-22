Below code formats table correctly but doesnt scrape other elements - 

let isScrapingMode = false;
let scrapedData = [];
let currentElement = null;

function cleanText(text) {
    // Remove extra whitespaces, newlines, and trim
    return text.replace(/\s+/g, ' ').trim();
}

function extractTableData(element) {
    // Find the closest table if clicked element is part of a table
    const table = element.closest('table');
    if (!table) {
        return null;
    }

    const rows = [];
    const tableRows = table.querySelectorAll('tr');
    
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

function generateCSV(data) {
    if (data.length === 0) {
        console.error('No data to export');
        return null;
    }

    try {
        return data.map(row => 
            Array.isArray(row) ? 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') :
                `"${String(row).replace(/"/g, '""')}"`
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

    const table = event.target.closest('table');
    if (table) {
        const extractedData = extractTableData(table);
        if (extractedData) {
            // Replace existing data with new table data
            scrapedData = extractedData;
            
            // Add a temporary outline to the entire table
            table.style.outline = '3px solid #4CAF50';  // Solid green outline
            table.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';  // Very light green background
            
            // Remove the highlight after a delay
            setTimeout(() => {
                table.style.outline = '';
                table.style.backgroundColor = '';
            }, 1000);  // Increased duration to 1 second for better visibility

            // Also highlight the clicked cell
            const clickedCell = event.target.closest('td, th');
            if (clickedCell) {
                clickedCell.style.backgroundColor = '#90EE90';  // Light green
                setTimeout(() => {
                    clickedCell.style.backgroundColor = '';
                }, 500);
            }
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startScraping') {
        isScrapingMode = true;
        scrapedData = []; // Reset scraped data
        alert('Scraping mode activated! Click on a table to scrape.');
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
                    alert(`Table data exported to CSV`);
                } else {
                    alert('CSV download failed. Check browser console.');
                }
            });
        } else {
            alert('No data to export');
        }
    }
});