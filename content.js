let isScrapingMode = false;
let scrapedData = [];
let currentElement = null;

function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function extractData(element) {
    // Check if element is or is part of a table
    const table = element.closest('table');
    if (table) {
        return extractTableData(table);
    }
    // For non-table elements, return cleaned text content
    return cleanText(element.textContent);
}

function extractTableData(table) {
    const rows = [];
    const tableRows = table.querySelectorAll('tr');
    
    // Handle tables with explicit tr elements
    if (tableRows.length > 0) {
        tableRows.forEach(row => {
            const rowData = [];
            // Get both header and data cells
            const cells = row.querySelectorAll('td, th');
            
            cells.forEach(cell => {
                // Account for colspan
                const colspan = parseInt(cell.getAttribute('colspan')) || 1;
                const cellText = cleanText(cell.textContent);
                
                // Add the cell value according to colspan
                for (let i = 0; i < colspan; i++) {
                    rowData.push(cellText);
                }
            });
            
            // Only add non-empty rows
            if (rowData.some(cell => cell.length > 0)) {
                rows.push(rowData);
            }
        });
        
        return rows;
    }
    
    // For tables without tr elements, try to get direct td/th elements
    const cells = table.querySelectorAll('td, th');
    if (cells.length > 0) {
        const singleRow = [];
        cells.forEach(cell => {
            singleRow.push(cleanText(cell.textContent));
        });
        if (singleRow.some(cell => cell.length > 0)) {
            rows.push(singleRow);
        }
    }
    
    return rows;
}

function generateCSV(data) {
    if (!data || data.length === 0) {
        console.error('No data to export');
        return null;
    }

    try {
        return data.map(row => {
            if (Array.isArray(row)) {
                // Handle table rows - escape quotes and commas in cells
                return row.map(cell => {
                    const escaped = String(cell).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',');
            } else {
                // Handle single text entries
                const escaped = String(row).replace(/"/g, '""');
                return `"${escaped}"`;
            }
        }).join('\n');
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
    
    const extractedData = extractData(event.target);
    if (extractedData) {
        if (Array.isArray(extractedData) && extractedData.length > 0) {
            // For table data, replace existing data
            scrapedData = extractedData;
        } else {
            // For non-table elements, append to existing data
            scrapedData.push(extractedData);
        }
        
        // Visual feedback
        const targetElement = event.target.closest('table') || event.target;
        const originalBackground = targetElement.style.backgroundColor;
        targetElement.style.backgroundColor = 'rgba(144, 238, 144, 0.3)';
        setTimeout(() => {
            targetElement.style.backgroundColor = originalBackground;
        }, 500);
    }
});

// Message listener for Chrome extension
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
                    alert('Data exported successfully to CSV');
                } else {
                    alert('CSV download failed. Check browser console.');
                }
            });
        } else {
            alert('No data to export');
        }
    }
});