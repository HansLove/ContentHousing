// Telegram Content Creator - Multi-Purpose Content Creation Tool
class TelegramContentCreator {
  constructor() {
    this.currentType = 'general';
    // this.backendUrl = 'http://localhost:3002/telegram/makePost';
    this.backendUrl = 'https://taloon-studio-backoffice-23773ec9ff31.herokuapp.com/telegram/makePost';
    this.uploadedImage = null;
    this.templates = JSON.parse(localStorage.getItem('telegramTemplates') || '[]');
    this.stats = {
      totalPosts: 0,
      general: 0,
      listing: 0,
      market: 0,
      tips: 0,
      news: 0,
      announcement: 0,
      educational: 0
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.showForm('general');
    this.loadTemplates();
    this.updateStats();
    this.setupUrlDescriptionReader();
  }

  setupEventListeners() {
    // Content type switching
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.switchContentType(type);
      });
    });

    // Action buttons
    document.getElementById('btnPreview').addEventListener('click', () => this.generatePreview());
    document.getElementById('btnCopy').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('btnSend').addEventListener('click', () => this.sendToBackend());
    document.getElementById('btnClear').addEventListener('click', () => this.clearForms());
    document.getElementById('btnSave').addEventListener('click', () => this.saveAsTemplate());

    // Image upload
    this.setupImageUpload();
  }

  setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageUpload');
    const removeBtn = document.getElementById('removeImage');

    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#2563eb';
      uploadArea.style.background = '#e2e8f0';
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#e2e8f0';
      uploadArea.style.background = '#f1f5f9';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#e2e8f0';
      uploadArea.style.background = '#f1f5f9';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleImageUpload(files[0]);
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleImageUpload(e.target.files[0]);
      }
    });

    // Remove image
    removeBtn.addEventListener('click', () => this.removeImage());
  }

  handleImageUpload(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImage = {
        file: file,
        dataUrl: e.target.result,
        base64: e.target.result.split(',')[1]
      };
      this.displayImagePreview();
    };
    reader.readAsDataURL(file);
  }

  displayImagePreview() {
    const uploadArea = document.getElementById('imageUploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImage');

    uploadArea.style.display = 'none';
    imagePreview.style.display = 'block';
    previewImg.src = this.uploadedImage.dataUrl;
  }

  removeImage() {
    this.uploadedImage = null;
    document.getElementById('imageUploadArea').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageUpload').value = '';
  }

  switchContentType(type) {
    // Update active button
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');

    // Update preview type
    document.getElementById('previewType').textContent = this.getTypeDisplayName(type);

    // Show/hide forms
    this.showForm(type);
    this.currentType = type;

    // Clear preview
    this.clearPreview();
  }

  getTypeDisplayName(type) {
    const names = {
      'general': 'General Post',
      'listing': 'Property Listing',
      'market': 'Market Update',
      'tips': 'Buying Tips',
      'news': 'Industry News',
      'announcement': 'Announcement',
      'educational': 'Educational Content'
    };
    return names[type] || type;
  }

  setupUrlDescriptionReader() {
    // Read URL parameters for description
    const urlParams = new URLSearchParams(window.location.search);
    const description = urlParams.get("description");
    const url = urlParams.get("url");
    const chat_id = urlParams.get("chat_id");

    if (description) {
      // Try to populate description in the current form
      const descriptionField = document.getElementById(`${this.currentType}Description`) || 
                              document.getElementById(`${this.currentType}Content`) ||
                              document.getElementById(`${this.currentType}Summary`);
      
      if (descriptionField) {
        descriptionField.value = description;
        this.showToast('✅ Description loaded from URL', 'success');
      }
    }

    if (url) {
      // Store URL for reference
      this.sourceUrl = url;
      this.showToast('✅ Source URL detected', 'info');
    }

    if (chat_id) {
      // Store chat_id for Telegram posting
      this.chat_id = chat_id;
      this.showToast('✅ Chat ID detected for Telegram posting', 'info');
      this.showChatIdIndicator(chat_id);
    }
  }

  showForm(type) {
    // Hide all forms
    document.querySelectorAll('.content-form').forEach(form => {
      form.classList.remove('active');
    });

    // Show selected form
    const form = document.getElementById(`${type}Form`);
    if (form) {
      form.classList.add('active');
    }
  }

  generatePreview() {
    let previewContent = '';
    
    switch (this.currentType) {
      case 'general':
        previewContent = this.generateGeneralPreview();
        break;
      case 'listing':
        previewContent = this.generateListingPreview();
        break;
      case 'market':
        previewContent = this.generateMarketPreview();
        break;
      case 'tips':
        previewContent = this.generateTipsPreview();
        break;
      case 'news':
        previewContent = this.generateNewsPreview();
        break;
      case 'announcement':
        previewContent = this.generateAnnouncementPreview();
        break;
      case 'educational':
        previewContent = this.generateEducationalPreview();
        break;
    }

    if (previewContent) {
      this.displayPreview(previewContent);
    }
  }

  generateGeneralPreview() {
    const title = document.getElementById('generalTitle').value;
    const content = document.getElementById('generalContent').value;
    const category = document.getElementById('generalCategory').value;
    const author = document.getElementById('generalAuthor').value;
    const hashtags = document.getElementById('generalHashtags').value;

    if (!title || !content || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    let preview = `📢 ${title}\n`;
    preview += `═══════════════════\n\n`;
    
    if (category) {
      preview += `🏷️ Category: ${category}\n\n`;
    }
    
    preview += `${content}\n\n`;
    
    if (hashtags) {
      preview += `#${hashtags.replace(/\s+/g, ' #')}`;
    } else {
      preview += `#General #Update`;
    }

    return preview;
  }

  generateAnnouncementPreview() {
    const title = document.getElementById('announcementTitle').value;
    const content = document.getElementById('announcementContent').value;
    const priority = document.getElementById('announcementPriority').value;
    const author = document.getElementById('announcementAuthor').value;
    const action = document.getElementById('announcementAction').value;

    if (!title || !content || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const priorityEmoji = priority === 'High' ? '🚨' : priority === 'Medium' ? '📢' : '📋';

    let preview = `${priorityEmoji} ANNOUNCEMENT\n`;
    preview += `═══════════════════\n\n`;
    preview += `📝 ${title}\n\n`;
    preview += `${content}\n\n`;
    
    if (action) {
      preview += `🎯 ACTION REQUIRED:\n`;
      preview += `${action}\n\n`;
    }
    
    preview += `👤 ${author}\n`;
    preview += `═══════════════════\n`;
    preview += `📢 #Announcement #${priority}`;

    return preview;
  }

  generateEducationalPreview() {
    const topic = document.getElementById('educationalTopic').value;
    const level = document.getElementById('educationalLevel').value;
    const title = document.getElementById('educationalTitle').value;
    const content = document.getElementById('educationalContent').value;
    const keyPoints = document.getElementById('educationalKeyPoints').value;
    const author = document.getElementById('educationalAuthor').value;

    if (!topic || !level || !title || !content || !keyPoints || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const levelEmoji = level === 'Beginner' ? '🟢' : level === 'Intermediate' ? '🟡' : '🔴';

    let preview = `📚 EDUCATIONAL CONTENT\n`;
    preview += `═══════════════════\n\n`;
    preview += `🎯 Topic: ${topic}\n`;
    preview += `${levelEmoji} Level: ${level}\n\n`;
    
    preview += `📖 ${title}\n`;
    preview += `═══════════════════\n\n`;
    
    preview += `💡 CONTENT:\n`;
    preview += `${content}\n\n`;
    
    preview += `🔑 KEY POINTS:\n`;
    preview += `${keyPoints}\n\n`;
    
    preview += `👤 ${author}\n`;
    preview += `═══════════════════\n`;
    preview += `📚 #Education #${topic.replace(/\s+/g, '')} #Learning`;

    return preview;
  }

  generateListingPreview() {
    const type = document.getElementById('listingType').value;
    const status = document.getElementById('listingStatus').value;
    const price = document.getElementById('listingPrice').value;
    const beds = document.getElementById('listingBeds').value;
    const baths = document.getElementById('listingBaths').value;
    const sqft = document.getElementById('listingSqft').value;
    const address = document.getElementById('listingAddress').value;
    const city = document.getElementById('listingCity').value;
    const state = document.getElementById('listingState').value;
    const zip = document.getElementById('listingZip').value;
    const features = document.getElementById('listingFeatures').value;
    const description = document.getElementById('listingDescription').value;
    const highlights = document.getElementById('listingHighlights').value;
    const agent = document.getElementById('listingAgent').value;
    const phone = document.getElementById('listingPhone').value;
    const email = document.getElementById('listingEmail').value;

    if (!type || !status || !price || !beds || !baths || !address || !city || !state || !zip || !description || !agent) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const statusEmoji = status === 'For Sale' ? '🏠' : status === 'For Rent' ? '🔑' : status === 'Sold' ? '✅' : '📋';
    const typeEmoji = type === 'House' ? '🏡' : type === 'Apartment' ? '🏢' : type === 'Condo' ? '🏘️' : type === 'Townhouse' ? '🏘️' : type === 'Land' ? '🌱' : '🏢';

    let preview = `${statusEmoji} ${status.toUpperCase()}\n`;
    preview += `${typeEmoji} ${type}\n`;
    preview += `═══════════════════\n\n`;
    
    preview += `💰 PRICE: ${price}\n`;
    preview += `🛏️ ${beds} Bed${beds !== '1' ? 's' : ''} | 🚿 ${baths} Bath${baths !== '1' ? 's' : ''}\n`;
    if (sqft) preview += `📏 ${sqft} sqft\n`;
    preview += `\n`;
    
    preview += `📍 LOCATION:\n`;
    preview += `${address}\n`;
    preview += `${city}, ${state} ${zip}\n\n`;
    
    if (features) {
      preview += `✨ FEATURES:\n`;
      preview += `${features}\n\n`;
    }
    
    preview += `📝 DESCRIPTION:\n`;
    preview += `${description}\n\n`;
    
    if (highlights) {
      preview += `🌟 HIGHLIGHTS:\n`;
      preview += `${highlights}\n\n`;
    }
    
    preview += `👤 CONTACT:\n`;
    preview += `${agent}\n`;
    if (phone) preview += `📞 ${phone}\n`;
    if (email) preview += `📧 ${email}\n`;
    preview += `\n`;
    preview += `═══════════════════\n`;
    preview += `🏠 #RealEstate #${city.replace(/\s+/g, '')} #${type}`;

    return preview;
  }

  generateMarketPreview() {
    const area = document.getElementById('marketArea').value;
    const period = document.getElementById('marketPeriod').value;
    const type = document.getElementById('marketType').value;
    const trend = document.getElementById('marketTrend').value;
    const avgPrice = document.getElementById('marketAvgPrice').value;
    const daysOnMarket = document.getElementById('marketDaysOnMarket').value;
    const inventory = document.getElementById('marketInventory').value;
    const priceChange = document.getElementById('marketPriceChange').value;
    const title = document.getElementById('marketTitle').value;
    const analysis = document.getElementById('marketAnalysis').value;
    const outlook = document.getElementById('marketOutlook').value;
    const author = document.getElementById('marketAuthor').value;

    if (!area || !period || !type || !trend || !avgPrice || !daysOnMarket || !inventory || !title || !analysis || !outlook || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const trendEmoji = trend === 'Rising' ? '📈' : trend === 'Stable' ? '➡️' : trend === 'Declining' ? '📉' : '🔄';
    const inventoryEmoji = inventory === 'Low' ? '📉' : inventory === 'Balanced' ? '➡️' : '📈';

    let preview = `📊 MARKET UPDATE\n`;
    preview += `═══════════════════\n\n`;
    preview += `🏘️ ${title}\n`;
    preview += `📍 ${area} | ${period}\n`;
    preview += `🏠 ${type}\n\n`;
    
    preview += `📈 MARKET TREND: ${trendEmoji} ${trend}\n`;
    preview += `💰 Average Price: ${avgPrice}\n`;
    preview += `⏱️ Days on Market: ${daysOnMarket}\n`;
    preview += `📦 Inventory: ${inventoryEmoji} ${inventory}\n`;
    if (priceChange) preview += `📊 Price Change: ${priceChange}\n`;
    preview += `\n`;
    
    preview += `🔍 ANALYSIS:\n`;
    preview += `${analysis}\n\n`;
    
    preview += `🔮 OUTLOOK:\n`;
    preview += `${outlook}\n\n`;
    
    preview += `👤 ${author}\n`;
    preview += `═══════════════════\n`;
    preview += `📊 #MarketUpdate #${area.replace(/\s+/g, '')} #RealEstate`;

    return preview;
  }

  generateTipsPreview() {
    const category = document.getElementById('tipsCategory').value;
    const level = document.getElementById('tipsLevel').value;
    const title = document.getElementById('tipsTitle').value;
    const content = document.getElementById('tipsContent').value;
    const actionSteps = document.getElementById('tipsActionSteps').value;
    const author = document.getElementById('tipsAuthor').value;

    if (!category || !level || !title || !content || !actionSteps || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const levelEmoji = level === 'Beginner' ? '🟢' : level === 'Intermediate' ? '🟡' : '🔴';
    const categoryEmoji = '💡';

    let preview = `💡 BUYING TIPS\n`;
    preview += `═══════════════════\n\n`;
    preview += `${categoryEmoji} ${category}\n`;
    preview += `${levelEmoji} ${level} Level\n\n`;
    
    preview += `📝 ${title}\n`;
    preview += `═══════════════════\n\n`;
    
    preview += `💭 TIP:\n`;
    preview += `${content}\n\n`;
    
    preview += `✅ ACTION STEPS:\n`;
    preview += `${actionSteps}\n\n`;
    
    preview += `👤 ${author}\n`;
    preview += `═══════════════════\n`;
    preview += `💡 #BuyingTips #${category.replace(/\s+/g, '')} #RealEstate`;

    return preview;
  }

  generateNewsPreview() {
    const category = document.getElementById('newsCategory').value;
    const impact = document.getElementById('newsImpact').value;
    const title = document.getElementById('newsTitle').value;
    const summary = document.getElementById('newsSummary').value;
    const details = document.getElementById('newsDetails').value;
    const takeaway = document.getElementById('newsTakeaway').value;
    const author = document.getElementById('newsAuthor').value;

    if (!category || !impact || !title || !summary || !details || !takeaway || !author) {
      this.showToast('Please fill in all required fields', 'warning');
      return '';
    }

    const impactEmoji = impact === 'Positive' ? '📈' : impact === 'Negative' ? '📉' : impact === 'Mixed' ? '🔄' : '➡️';
    const categoryEmoji = '📰';

    let preview = `📰 INDUSTRY NEWS\n`;
    preview += `═══════════════════\n\n`;
    preview += `${categoryEmoji} ${category}\n`;
    preview += `${impactEmoji} Market Impact: ${impact}\n\n`;
    
    preview += `📝 ${title}\n`;
    preview += `═══════════════════\n\n`;
    
    preview += `📋 SUMMARY:\n`;
    preview += `${summary}\n\n`;
    
    preview += `📖 DETAILS:\n`;
    preview += `${details}\n\n`;
    
    preview += `🔑 KEY TAKEAWAY:\n`;
    preview += `${takeaway}\n\n`;
    
    preview += `👤 ${author}\n`;
    preview += `═══════════════════\n`;
    preview += `📰 #IndustryNews #${category.replace(/\s+/g, '')} #RealEstate`;

    return preview;
  }

  displayPreview(content) {
    if (!content) return;

    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = `
      <div class="preview-message">
        <pre>${content}</pre>
      </div>
    `;
  }

  clearPreview() {
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = `
      <div class="preview-placeholder">
        <i class="fas fa-eye"></i>
        <p>Click "Preview" to see your content</p>
      </div>
    `;
  }

  // Copy to Clipboard
  async copyToClipboard() {
    let content = '';
    
    switch (this.currentType) {
      case 'general':
        content = this.generateGeneralPreview();
        break;
      case 'listing':
        content = this.generateListingPreview();
        break;
      case 'market':
        content = this.generateMarketPreview();
        break;
      case 'tips':
        content = this.generateTipsPreview();
        break;
      case 'news':
        content = this.generateNewsPreview();
        break;
      case 'announcement':
        content = this.generateAnnouncementPreview();
        break;
      case 'educational':
        content = this.generateEducationalPreview();
        break;
    }

    if (!content) {
      this.showToast('Please generate a preview first', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      this.showToast('✅ Content copied to clipboard! Ready to paste in Telegram', 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('✅ Content copied to clipboard! Ready to paste in Telegram', 'success');
    }
  }

  // Save as Template
  saveAsTemplate() {
    let content = '';
    
    switch (this.currentType) {
      case 'general':
        content = this.generateGeneralPreview();
        break;
      case 'listing':
        content = this.generateListingPreview();
        break;
      case 'market':
        content = this.generateMarketPreview();
        break;
      case 'tips':
        content = this.generateTipsPreview();
        break;
      case 'news':
        content = this.generateNewsPreview();
        break;
      case 'announcement':
        content = this.generateAnnouncementPreview();
        break;
      case 'educational':
        content = this.generateEducationalPreview();
        break;
    }

    if (!content) {
      this.showToast('Please generate a preview first', 'warning');
      return;
    }

    const templateName = prompt('Give this template a name (e.g., "Standard Property Listing"):') || 'Unnamed Template';
    
    const template = {
      id: Date.now(),
      type: this.currentType,
      name: templateName,
      content: content,
      timestamp: new Date().toISOString()
    };

    this.templates.push(template);
    localStorage.setItem('telegramTemplates', JSON.stringify(this.templates));
    this.loadTemplates();
    this.showToast('✅ Template saved successfully!', 'success');
  }

  loadTemplates() {
    const templatesContainer = document.getElementById('templatesContainer');
    if (!templatesContainer) return;

    if (this.templates.length === 0) {
      templatesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem 0;">No templates saved yet. Create content and save it as a template!</p>';
      return;
    }

    let templatesHtml = '<h4 style="margin-bottom: 1rem; color: var(--text);">💾 Your Templates</h4>';
    this.templates.forEach(template => {
      templatesHtml += `
        <div style="background: var(--bg-light); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span style="font-weight: 600; color: var(--text);">${template.name}</span>
            <span style="background: var(--primary); color: white; padding: 0.2rem 0.5rem; border-radius: 0.3rem; font-size: 0.7rem; text-transform: uppercase;">${template.type}</span>
            <span style="color: var(--text-muted); font-size: 0.8rem;">${new Date(template.timestamp).toLocaleDateString()}</span>
          </div>
          <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.8rem; line-height: 1.4;">${template.content.substring(0, 100)}...</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button onclick="telegramContentCreator.loadTemplate(${template.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border: none; border-radius: 0.3rem; cursor: pointer; background: var(--primary); color: white; transition: all 0.2s ease;">Load</button>
            <button onclick="telegramContentCreator.copyTemplate(${template.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border: none; border-radius: 0.3rem; cursor: pointer; background: var(--success); color: white; transition: all 0.2s ease;">Copy</button>
            <button onclick="telegramContentCreator.deleteTemplate(${template.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border: none; border-radius: 0.3rem; cursor: pointer; background: var(--danger); color: white; transition: all 0.2s ease;">Delete</button>
          </div>
        </div>
      `;
    });

    templatesContainer.innerHTML = templatesHtml;
  }

  loadTemplate(id) {
    const template = this.templates.find(t => t.id === id);
    if (!template) return;

    // Switch to the correct content type
    this.switchContentType(template.type);
    
    // For now, just show a success message
    // In a full implementation, you'd populate the form fields
    this.showToast('✅ Template loaded! (Form population would be implemented here)', 'success');
  }

  copyTemplate(id) {
    const template = this.templates.find(t => t.id === id);
    if (!template) return;

    navigator.clipboard.writeText(template.content);
    this.showToast('✅ Template copied to clipboard!', 'success');
  }

  deleteTemplate(id) {
    if (confirm('Are you sure you want to delete this template?')) {
      this.templates = this.templates.filter(t => t.id !== id);
      localStorage.setItem('telegramTemplates', JSON.stringify(this.templates));
      this.loadTemplates();
      this.showToast('✅ Template deleted!', 'success');
    }
  }

  // Update Stats
  updateStats() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;

    statsContent.innerHTML = `
      <div style="text-align: center;">
        <h4 style="margin-bottom: 1rem; color: var(--text);">📊 Content Statistics</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="background: var(--bg-light); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border);">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${this.stats.totalPosts}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Total Posts</div>
          </div>
          <div style="background: var(--bg-light); padding: 1rem; border-radius: 0.75rem; border: 1px solid var(--border);">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${this.templates.length}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Templates</div>
          </div>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 0.75rem; border: 1px solid var(--border);">
          <div style="font-size: 0.9rem; color: var(--text-muted);">
            <div>📢 General: ${this.stats.general}</div>
            <div>🏠 Listings: ${this.stats.listing}</div>
            <div>📊 Market Updates: ${this.stats.market}</div>
            <div>💡 Tips: ${this.stats.tips}</div>
            <div>📰 News: ${this.stats.news}</div>
            <div>📢 Announcements: ${this.stats.announcement}</div>
            <div>📚 Educational: ${this.stats.educational}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Send to Backend
  async sendToBackend() {
    let message = '';
    
    switch (this.currentType) {
      case 'general':
        message = this.generateGeneralPreview();
        break;
      case 'listing':
        message = this.generateListingPreview();
        break;
      case 'market':
        message = this.generateMarketPreview();
        break;
      case 'tips':
        message = this.generateTipsPreview();
        break;
      case 'news':
        message = this.generateNewsPreview();
        break;
      case 'announcement':
        message = this.generateAnnouncementPreview();
        break;
      case 'educational':
        message = this.generateEducationalPreview();
        break;
    }

    if (!message) {
      this.showToast('Please generate a preview first', 'warning');
      return;
    }

    try {
      this.showToast('Sending to Telegram...', 'info');
      
      // Prepare payload with image if available
      const payload = {
        message: message
      };

      // Add chat_id if available from URL parameter
      if (this.chat_id) {
        payload.chat_id = this.chat_id;
      }

      if (this.uploadedImage) {
        payload.image = this.uploadedImage.base64;
        payload.imageName = this.uploadedImage.file.name;
        payload.imageType = this.uploadedImage.file.type;
      }

      console.log('Sending payload:', payload);

      const response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        this.showToast('✅ Successfully sent to Telegram!', 'success');
        console.log('Backend response:', result);
        
        // Update stats
        this.stats.totalPosts++;
        switch (this.currentType) {
          case 'general': this.stats.general++; break;
          case 'listing': this.stats.listing++; break;
          case 'market': this.stats.market++; break;
          case 'tips': this.stats.tips++; break;
          case 'news': this.stats.news++; break;
          case 'announcement': this.stats.announcement++; break;
          case 'educational': this.stats.educational++; break;
        }
        this.updateStats();
      } else {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        this.showToast('❌ Error sending to Telegram', 'error');
      }
    } catch (error) {
      console.error('Network error:', error);
      this.showToast('❌ Network error - check console', 'error');
    }
  }

  clearForms() {
    // Clear all forms
    document.querySelectorAll('.content-form').forEach(form => {
      form.reset();
    });

    // Clear image
    this.removeImage();

    // Clear preview
    this.clearPreview();

    // Show success message
    this.showToast('✅ All forms cleared', 'success');
  }

  showChatIdIndicator(chat_id) {
    const indicator = document.getElementById('chatIdIndicator');
    if (indicator) {
      indicator.style.display = 'flex';
      indicator.innerHTML = `
        <i class="fas fa-telegram"></i>
        <span>Chat ID detected - Ready for direct posting</span>
      `;
      indicator.setAttribute('data-chat-id', chat_id);
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    // Remove existing classes
    toast.className = 'toast';
    
    // Add type-specific styling
    switch (type) {
      case 'success':
        toast.style.borderColor = 'var(--success)';
        toast.style.color = 'var(--success)';
        break;
      case 'warning':
        toast.style.borderColor = 'var(--warning)';
        toast.style.color = 'var(--warning)';
        break;
      case 'error':
        toast.style.borderColor = 'var(--danger)';
        toast.style.color = 'var(--danger)';
        break;
      default:
        toast.style.borderColor = 'var(--primary)';
        toast.style.color = 'var(--primary)';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Initialize the application when DOM is loaded
let telegramContentCreator;
document.addEventListener('DOMContentLoaded', () => {
  telegramContentCreator = new TelegramContentCreator();
});

// Add some sample data for testing (optional)
function populateSampleData() {
  // Sample listing data
  document.getElementById('listingType').value = 'House';
  document.getElementById('listingStatus').value = 'For Sale';
  document.getElementById('listingPrice').value = '$450,000';
  document.getElementById('listingBeds').value = '3';
  document.getElementById('listingBaths').value = '2';
  document.getElementById('listingSqft').value = '1,200 sqft';
  document.getElementById('listingAddress').value = '123 Main Street';
  document.getElementById('listingCity').value = 'Austin';
  document.getElementById('listingState').value = 'TX';
  document.getElementById('listingZip').value = '78701';
  document.getElementById('listingFeatures').value = 'Updated kitchen, Hardwood floors, Large backyard, New HVAC system';
  document.getElementById('listingDescription').value = 'Beautiful 3-bedroom home in the heart of Austin. This charming property features an updated kitchen with granite countertops, hardwood floors throughout, and a spacious backyard perfect for entertaining. Recent updates include a new HVAC system and fresh paint.';
  document.getElementById('listingHighlights').value = '1. Prime location in downtown Austin\n2. Recently updated kitchen and HVAC\n3. Hardwood floors and modern finishes\n4. Large backyard with mature trees\n5. Walkable to restaurants and shops';
  document.getElementById('listingAgent').value = 'Sarah Johnson';
  document.getElementById('listingPhone').value = '(512) 555-0123';
  document.getElementById('listingEmail').value = 'sarah.johnson@realty.com';
}

// Uncomment the line below to populate sample data for testing
// populateSampleData();

document.addEventListener("DOMContentLoaded", () => {
  // 1. Read URL parameters
  // URL parameter handling is now done in the main class setupUrlDescriptionReader method

  // 3. Handle image upload preview
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  const previewImage = document.getElementById("previewImage");
  const removeImage = document.getElementById("removeImage");

  if (imageUpload && imagePreview && previewImage && removeImage) {
    imageUpload.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });

    removeImage.addEventListener("click", () => {
      imageUpload.value = "";
      imagePreview.style.display = "none";
      previewImage.src = "";
    });
  }

  // 4. Send to Telegram (example implementation)
  const sendButton = document.getElementById("btnSend");
  if (sendButton) {
    sendButton.addEventListener("click", () => {
      const description = document.getElementById("listingDescription").value;
      const generalContent = document.getElementById("generalContent").value;
      const imageFile = imageUpload.files[0];

      if (!description&&!generalContent) {
        alert("Please add a description before sending.");
        return;
      }

      const formData = new FormData();
      formData.append("description", description||generalContent);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Replace with your Telegram bot API endpoint
      const telegramApiUrl = "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage";

      fetch(telegramApiUrl, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.ok) {
            alert("Content sent to Telegram successfully!");
          } else {
            // alert("Failed to send content to Telegram.");
            console.error("Failed to send content to Telegram.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred while sending content.");
        });
    });
  }
});
