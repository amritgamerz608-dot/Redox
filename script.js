// ==================== UTILITY FUNCTIONS ====================

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Show status message
function showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Hide status message
function hideStatusMessage() {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.classList.add('hidden');
}

// Update progress bar
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percent + '%';
    progressText.textContent = `Downloading... ${percent}%`;
}

// ==================== PASTE FROM CLIPBOARD ====================
const pasteBtn = document.getElementById('pasteBtn');
const videoUrl = document.getElementById('videoUrl');

pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoUrl.value = text;
        showToast('Link pasted successfully!', 'success');
    } catch (err) {
        showToast('Failed to paste. Please paste manually.', 'error');
    }
});

// ==================== VIDEO DOWNLOAD FUNCTIONALITY ====================
const downloadBtn = document.getElementById('downloadBtn');
const progressContainer = document.getElementById('progressContainer');
const videoPreview = document.getElementById('videoPreview');
const videoPlayer = document.getElementById('videoPlayer');

// RedNote URL patterns
const redNotePatterns = [
    /https?:\/\/(www\.)?rednote\.com\/.*video\/.*/i,
    /https?:\/\/(www\.)?rednote\.com\/.*/i,
    /rednote\.com\//i
];

function isValidRedNoteUrl(url) {
    return redNotePatterns.some(pattern => pattern.test(url));
}

// Extract video ID from RedNote URL
function extractVideoId(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        
        // Try to extract video ID from URL
        const match = pathname.match(/video\/([a-zA-Z0-9]+)/);
        if (match && match[1]) {
            return match[1];
        }
        
        // If no match, use the pathname
        return pathname.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    } catch (err) {
        return null;
    }
}

// Fetch video metadata and stream
async function fetchVideoData(videoUrl) {
    try {
        // Note: This is a demonstration. In production, you would need a proper backend API
        // that handles RedNote's authentication and video streaming
        
        showStatusMessage('Fetching video information...', 'info');
        
        // Simulated API call - replace with actual backend API
        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        }).catch(err => {
            // For demo purposes, show error
            throw new Error('Backend API not configured. Please set up a backend server.');
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        console.error('Error fetching video:', err);
        throw err;
    }
}

// Download video with progress tracking
async function downloadVideo(videoUrl) {
    try {
        progressContainer.classList.remove('hidden');
        hideStatusMessage();
        
        // Validate URL
        if (!videoUrl.trim()) {
            showStatusMessage('Please enter a RedNote video link', 'error');
            progressContainer.classList.add('hidden');
            return;
        }

        if (!isValidRedNoteUrl(videoUrl)) {
            showStatusMessage('Please enter a valid RedNote video link', 'error');
            progressContainer.classList.add('hidden');
            return;
        }

        showStatusMessage('Processing your request...', 'info');
        updateProgress(10);

        // Create a fetch request to download the video
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        }).catch(err => {
            // Demo fallback - show how it would work
            console.log('Note: Backend not available. This is a demo.');
            return null;
        });

        if (!response) {
            // Demo mode - show simulated progress
            showStatusMessage('Demo Mode: Simulating download...', 'info');
            simulateDownload();
            return;
        }

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        updateProgress(50);

        // Get the blob
        const blob = await response.blob();
        updateProgress(80);

        // Create blob URL and download
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `redox-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);

        updateProgress(100);
        
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            showStatusMessage('✓ Video downloaded successfully!', 'success');
            showToast('Video saved to your device!', 'success');
        }, 500);

    } catch (err) {
        progressContainer.classList.add('hidden');
        console.error('Download error:', err);
        showStatusMessage(`Error: ${err.message}`, 'error');
        showToast('Download failed', 'error');
    }
}

// Simulate download for demo
function simulateDownload() {
    let progress = 10;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) progress = 100;
        
        updateProgress(Math.floor(progress));
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Create a dummy video blob for demo
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            // Draw demo content
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Redox Demo Video', 320, 240);
            
            canvas.toBlob(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `redox-demo-${Date.now()}.webp`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
                
                progressContainer.classList.add('hidden');
                showStatusMessage('✓ Demo video downloaded! (Set up backend for real videos)', 'success');
                showToast('Demo download complete!', 'success');
            });
        }
    }, 300);
}

// Download button click handler
downloadBtn.addEventListener('click', () => {
    const url = videoUrl.value.trim();
    downloadVideo(url);
});

// Allow Enter key to download
videoUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        downloadBtn.click();
    }
});

// ==================== FAQ ACCORDION ====================
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isActive = answer.classList.contains('show');
        
        // Close all other FAQs
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.classList.remove('show');
        });
        document.querySelectorAll('.faq-question').forEach(q => {
            q.classList.remove('active');
        });
        
        // Toggle current FAQ
        if (!isActive) {
            answer.classList.add('show');
            question.classList.add('active');
        }
    });
});

// ==================== MOBILE MENU ====================
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    hideStatusMessage();
    progressContainer.classList.add('hidden');
    videoPreview.classList.add('hidden');
    
    // Log initialization
    console.log('Redox - RedNote Video Downloader loaded successfully!');
    console.log('Note: To enable real downloads, set up a backend API server.');
});

// ==================== BACKEND API SETUP ====================
/*
To enable real RedNote video downloads, you need to set up a backend server.
Here's what your backend should provide:

1. POST /api/video-info
   - Request: { url: "rednote_url" }
   - Response: { title, duration, thumbnail, downloadUrl }

2. POST /api/download
   - Request: { url: "rednote_url" }
   - Response: Video blob

Example Node.js/Express backend structure:

const express = require('express');
const axios = require('axios');
const app = express();

app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    
    try {
        // Use a RedNote video scraper library or API
        // Examples: yt-dlp, pytube alternative, or RedNote API
        
        const videoData = await fetchRedNoteVideo(url);
        res.download(videoData.path);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(3000);
*/