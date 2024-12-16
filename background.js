chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);
  
    if (request.action === 'downloadCSV') {
      console.log('Attempting to download CSV');
      try {
        chrome.downloads.download({
          url: request.csvUrl,
          filename: `web_scrape_${new Date().toISOString().split('T')[0]}.csv`,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Download error:', chrome.runtime.lastError);
            sendResponse({status: 'error', message: chrome.runtime.lastError});
          } else {
            console.log('Download started with ID:', downloadId);
            sendResponse({status: 'success', downloadId: downloadId});
          }
        });
        return true;  // Indicates we want to use sendResponse asynchronously
      } catch (error) {
        console.error('Exception in download:', error);
        sendResponse({status: 'error', message: error.toString()});
      }
    }
  });