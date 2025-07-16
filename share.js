// Enhanced share.js with working functionality
document.getElementById('shareBtn').addEventListener('click', async function(e) {
    e.stopPropagation();
    
    // Try native sharing first
    if (await tryNativeShare()) {
        return; // Native sharing worked, no need for custom menu
    }
    
    // Fallback to custom share menu
    document.getElementById('shareMenuOverlay').classList.add('active');
});

// Function to attempt native sharing
async function tryNativeShare() {
    // Check if Web Share API is supported
    if (!navigator.share) {
        return false;
    }
    
    try {
        // Get the canvas image
        const blob = await getCanvasBlob();
        const file = new File([blob], 'edited-image.png', { type: 'image/png' });
        
        // Check if we can share files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'My Edited Image',
                text: 'Check out this image I edited! Created with Smart Image Editor'
            });
            return true;
        }
        
        // If we can't share files, try sharing just text and URL
        await navigator.share({
            title: 'Smart Image Editor',
            text: 'Check out this amazing image editor!',
            url: window.location.href
        });
        return true;
        
    } catch (error) {
        // User cancelled or sharing failed
        console.log('Native sharing failed or was cancelled:', error);
        return false;
    }
}

// Close share menu when clicking outside
document.addEventListener('click', function(e) {
    const shareMenu = document.getElementById('shareMenuOverlay');
    const shareBtn = document.getElementById('shareBtn');
    
    if (shareMenu.classList.contains('active') && 
        !shareMenu.contains(e.target) && 
        !shareBtn.contains(e.target)) {
        shareMenu.classList.remove('active');
    }
});

// Prevent share menu from closing when clicking inside it
document.getElementById('shareMenuOverlay').addEventListener('click', function(e) {
    e.stopPropagation();
});

// Helper function to get canvas as high-quality blob
async function getCanvasBlob() {
    return new Promise(resolve => {
        const canvas = document.getElementById('canvas');
        canvas.toBlob(resolve, 'image/png', 1.0);
    });
}

// Helper function to get canvas as data URL
function getCanvasDataURL() {
    const canvas = document.getElementById('canvas');
    return canvas.toDataURL('image/png', 1.0);
}

// Helper function to show temporary feedback
function showShareFeedback(element, success = true, originalHTML) {
    // First restore the original HTML
    if (originalHTML) {
        element.innerHTML = originalHTML;
    }
    
    // Then show feedback
    const currentHTML = element.innerHTML;
    const icon = success ? 'fas fa-check' : 'fas fa-times';
    const color = success ? '#28a745' : '#dc3545';
    
    element.innerHTML = `<div class="share-option-icon" style="background: ${color}"><i class="${icon}"></i></div><div class="share-option-label">${success ? 'Shared!' : 'Error'}</div>`;
    
    setTimeout(() => {
        element.innerHTML = currentHTML;
    }, 2000);
}

// Main sharing function
async function shareToPlatform(platform, element, originalHTML) {
    try {
        const blob = await getCanvasBlob();
        const file = new File([blob], 'edited-image.png', { type: 'image/png' });
        const dataUrl = getCanvasDataURL();
        
        switch (platform) {
            case 'facebook':
                await shareToFacebook(file, dataUrl);
                break;
            case 'twitter':
                await shareToTwitter(file, dataUrl);
                break;
            case 'instagram':
                await shareToInstagram(file, dataUrl);
                break;
            case 'linkedin':
                await shareToLinkedIn(file, dataUrl);
                break;
            case 'pinterest':
                await shareToPinterest(file, dataUrl);
                break;
            case 'reddit':
                await shareToReddit(file, dataUrl);
                break;
            case 'tumblr':
                await shareToTumblr(file, dataUrl);
                break;
            case 'tiktok':
                await shareToTikTok(file, dataUrl);
                break;
            case 'snapchat':
                await shareToSnapchat(file, dataUrl);
                break;
            case 'whatsapp':
                await shareToWhatsApp(file, dataUrl);
                break;
            case 'telegram':
                await shareToTelegram(file, dataUrl);
                break;
            case 'discord':
                await shareToDiscord(file, dataUrl);
                break;
            case 'email':
                await shareViaEmail(file, dataUrl);
                break;
            default:
                throw new Error('Platform not supported');
        }
        
        showShareFeedback(element, true, originalHTML);
    } catch (error) {
        console.error('Share failed:', error);
        showShareFeedback(element, false, originalHTML);
    }
}

// Individual platform sharing functions
async function shareToFacebook(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Check out my edited image!',
            text: 'Created with Smart Image Editor'
        });
    } else {
        // Fallback: Open Facebook with text (image upload requires FB SDK)
        const text = encodeURIComponent('Check out my edited image! Created with Smart Image Editor');
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`, '_blank');
    }
}

async function shareToTwitter(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Check out my edited image!',
            text: 'Created with Smart Image Editor #ImageEditor #Design'
        });
    } else {
        // Fallback: Open Twitter compose
        const text = encodeURIComponent('Check out my edited image! Created with Smart Image Editor #ImageEditor #Design');
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
}

async function shareToInstagram(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My edited masterpiece!'
        });
    } else {
        // Instagram doesn't have direct web sharing, so download the image
        downloadImageForManualShare(dataUrl, 'instagram-share.png');
        alert('Image downloaded! Please upload it manually to Instagram.');
    }
}

async function shareToLinkedIn(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Professional image editing',
            text: 'Created with Smart Image Editor'
        });
    } else {
        const text = encodeURIComponent('Check out this professionally edited image! Created with Smart Image Editor');
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank');
    }
}

async function shareToPinterest(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Beautiful edited image'
        });
    } else {
        const description = encodeURIComponent('Beautiful edited image created with Smart Image Editor');
        const media = encodeURIComponent(dataUrl);
        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${media}&description=${description}`, '_blank');
    }
}

async function shareToReddit(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My edited image'
        });
    } else {
        const title = encodeURIComponent('My edited image [OC]');
        window.open(`https://www.reddit.com/submit?title=${title}`, '_blank');
    }
}

async function shareToTumblr(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My creative edit'
        });
    } else {
        const caption = encodeURIComponent('My creative edit made with Smart Image Editor');
        window.open(`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(window.location.href)}&caption=${caption}`, '_blank');
    }
}

async function shareToTikTok(file, dataUrl) {
    // TikTok doesn't support direct web sharing for images
    downloadImageForManualShare(dataUrl, 'tiktok-share.png');
    alert('Image downloaded! Please upload it manually to TikTok.');
}

async function shareToSnapchat(file, dataUrl) {
    // Snapchat doesn't support direct web sharing
    downloadImageForManualShare(dataUrl, 'snapchat-share.png');
    alert('Image downloaded! Please share it manually on Snapchat.');
}

async function shareToWhatsApp(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'Check this out!'
        });
    } else {
        // Check if mobile for WhatsApp app link
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            const text = encodeURIComponent('Check out my edited image! Created with Smart Image Editor');
            window.open(`whatsapp://send?text=${text}`, '_blank');
        } else {
            const text = encodeURIComponent('Check out my edited image! Created with Smart Image Editor');
            window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank');
        }
    }
}

async function shareToTelegram(file, dataUrl) {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My edited image'
        });
    } else {
        const text = encodeURIComponent('Check out my edited image! Created with Smart Image Editor');
        const url = encodeURIComponent(window.location.href);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    }
}

async function shareToDiscord(file, dataUrl) {
    // Discord doesn't have direct web sharing, but we can use the Web Share API or download
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My edited image for Discord'
        });
    } else {
        downloadImageForManualShare(dataUrl, 'discord-share.png');
        alert('Image downloaded! Please upload it manually to Discord.');
    }
}

async function shareViaEmail(file, dataUrl) {
    const subject = encodeURIComponent('Check out my edited image!');
    const body = encodeURIComponent(`Hi!\n\nI've created this image using Smart Image Editor. Check it out!\n\nBest regards`);
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            files: [file],
            title: 'My edited image',
            text: 'Check out my edited image!'
        });
    } else {
        // Fallback to mailto (image will need to be attached manually)
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        // Also download the image for manual attachment
        downloadImageForManualShare(dataUrl, 'email-attachment.png');
    }
}

// Helper function to download image for manual sharing
function downloadImageForManualShare(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Enhanced click handlers for share options with working functionality
document.querySelectorAll('.share-option').forEach(option => {
    option.addEventListener('click', async function() {
        const platform = this.getAttribute('data-platform');
        console.log('Sharing to:', platform);
        
        // Store original HTML and add loading state
        const originalHTML = this.innerHTML;
        this.innerHTML = '<div class="share-option-icon" style="background: #6c757d"><i class="fas fa-spinner fa-spin"></i></div><div class="share-option-label">Sharing...</div>';
        
        try {
            await shareToPlatform(platform, this, originalHTML);
        } catch (error) {
            console.error('Share error:', error);
            showShareFeedback(this, false, originalHTML);
        }
        
        // Close the share menu after a delay
        setTimeout(() => {
            document.getElementById('shareMenuOverlay').classList.remove('active');
        }, 1500);
    });
});