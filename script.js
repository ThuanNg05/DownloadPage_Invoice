// --- 1. CONFIGURATION ---
const REPO_CONFIG = {
    owner: "ThuanNg05",
    repo: "Invoice",    
};
const appName = "InvoiceApp";
let appConfig = {};

// --- 2. INITIALIZE DOM & FETCH DATA ---
document.addEventListener('DOMContentLoaded', async () => {    
    document.title = `${appName} - Tải xuống`;
    document.getElementById('nav-app-name').textContent = appName;
    document.getElementById('hero-title').textContent = appName;
    document.getElementById('footer-app-name').textContent = appName;
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // 2. Fetch dữ liệu từ GitHub API
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/releases/latest`);
        if (!response.ok) throw new Error('Không tìm thấy release mới nhất');
        
        const data = await response.json();
        const asset = data.assets.find(a => a.name.endsWith('.exe'));
        browser_download_url = `https://github.com/${REPO_CONFIG.owner}/${REPO_CONFIG.repo}/releases/download/${data.tag_name}/Setup.exe`;

        appConfig = {
            version: data.tag_name,
            fileName: asset ? asset.name : "N/A",
            fileSize: asset ? `${(asset.size / (1024 * 1024)).toFixed(1)} MB` : "N/A",
            updatedDate: new Date(data.published_at).toLocaleDateString('vi-VN'),
            downloadUrl: asset ? asset.browser_download_url : "#",
            sha256: extractSHA256(data.body),
            supportedOS: "Windows 10/11 (64-bit)"
        };
        
        updateUIWithConfig();
    } catch (error) {
        console.error('Lỗi khi lấy thông tin từ GitHub:', error);
        showToast('Không thể đồng bộ dữ liệu từ GitHub', 'info');
    }

    initFadeInObserver();
    initAccordion();
    initSmoothScroll();
});

// Hàm lấy mã SHA-256 từ mô tả (Release Notes)
function extractSHA256(bodyText) {
    const match = bodyText.match(/SHA-256:\s*([a-fA-F0-9]{64})/);
    return match ? match[1] : "Chưa công bố SHA-256";
}

function updateUIWithConfig() {
    if (!appConfig.version) return;

    document.getElementById('nav-version').textContent = `Latest: ${appConfig.version}`;
    document.getElementById('badge-version').textContent = `Phiên bản: ${appConfig.version}`;
    document.getElementById('badge-size').textContent = `Dung lượng: ${appConfig.fileSize}`;
    document.getElementById('badge-date').textContent = `Cập nhật: ${appConfig.updatedDate}`;
    
    document.getElementById('card-filename').textContent = appConfig.fileName;
    document.getElementById('card-os').textContent = appConfig.supportedOS;
    document.getElementById('sha256-value').textContent = appConfig.sha256;
    
    document.getElementById('guide-filename').textContent = appConfig.fileName;
    
    document.getElementById('changelog-version').textContent = appConfig.version;
    document.getElementById('changelog-date').textContent = appConfig.updatedDate;
}

// --- 3. DOWNLOAD LOGIC & TOAST ---
let isDownloading = false;

function triggerDownload() {
    if (isDownloading) return;
    
    const btn = document.getElementById('main-download-btn');
    const btnText = document.getElementById('download-text');
    const heroBtns = document.querySelectorAll('.hero .btn-primary');
    
    isDownloading = true;
    btn.classList.add('loading');
    btn.disabled = true;
    btnText.textContent = "Đang chuẩn bị tải...";
    heroBtns.forEach(b => { b.disabled = true; b.style.opacity = '0.7'; });

    showToast('Đang bắt đầu tải xuống file...', 'info');
    
    setTimeout(() => {        
        window.location.href = appConfig.downloadUrl; // <-- Bật dòng này ở thực tế
        
        // Demo mục đích (hiển thị thành công và reset nút)
        showToast(`Đã yêu cầu tải ${appConfig.fileName} thành công!`, 'success');
        
        // Reset UI sau 2 giây nữa
        setTimeout(() => {
            isDownloading = false;
            btn.classList.remove('loading');
            btn.disabled = false;
            btnText.textContent = "Tải xuống ngay";
            heroBtns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        }, 2000);

    }, 1500);
}

// --- 4. TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Icon dựa trên type
    const iconSvg = type === 'success' 
        ? `<svg class="toast-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        : `<svg class="toast-icon" style="color: #3b82f6;" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Đợi xíu để DOM render

    // Tự động xóa sau 4s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Đợi animation CSS ẩn xong
    }, 4000);
}

// --- 5. EXTRA FEATURES (Copy Version, Checksum) ---
function copyVersion() {
    navigator.clipboard.writeText(appConfig.version).then(() => {
        showToast(`Đã copy phiên bản ${appConfig.version} vào clipboard!`);
    }).catch(err => {
        // Fallback nếu clipboard API bị lỗi
        const textArea = document.createElement("textarea");
        textArea.value = appConfig.version;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(`Đã copy phiên bản ${appConfig.version} vào clipboard!`);
        } catch (err) {
            showToast('Không thể copy', 'info');
        }
        document.body.removeChild(textArea);
    });
}

function toggleChecksum() {
    const box = document.getElementById('checksum-display');
    box.classList.toggle('show');
}

// --- 6. SMOOTH SCROLL (Specific implementation) ---
function initSmoothScroll() {
    const guideBtn = document.getElementById('btn-scroll-guide');
    if (guideBtn) {
        guideBtn.addEventListener('click', () => {
            const guideSection = document.getElementById('guide');
            // Tính toán offset để không bị dính vào fixed navbar
            const yOffset = -80; 
            const y = guideSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        });
    }
}

// --- 7. FAQ ACCORDION LOGIC ---
function initAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Đóng tất cả các accordion khác (Optional - tuỳ chọn mở nhiều hay mở 1)
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-answer').style.maxHeight = null;
            });

            // Nếu click vào cái đang đóng thì mở lên
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
}

// --- 8. FADE-IN ON SCROLL ANIMATION ---
function initFadeInObserver() {
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Kích hoạt khi phần tử hiện 15% trong viewport
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Chỉ chạy 1 lần
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));
}