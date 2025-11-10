// Elementos do DOM
const shortenForm = document.getElementById('shortenForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const resultContainer = document.getElementById('result');

// Controlar estado do botão
function setButtonLoading(loading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Mostrar mensagem de erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Limpar erro
function clearError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

// Validar URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Enviar formulário
shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const url = urlInput.value.trim();

    // Validação básica
    if (!url) {
        showError('Por favor, insira uma URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('URL inválida. Use o formato: https://exemplo.com');
        return;
    }

    setButtonLoading(true);

    try {
        const response = await fetch('/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success) {
            displayResult(data.data);
        } else {
            if (data.errors && data.errors.length > 0) {
                showError(data.errors[0].msg);
            } else {
                showError(data.message || 'Erro ao encurtar URL');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao processar solicitação. Tente novamente.');
    } finally {
        setButtonLoading(false);
    }
});

// Exibir resultado
function displayResult(data) {
    document.getElementById('originalUrl').textContent = data.originalUrl;
    
    const shortUrlLink = document.getElementById('shortUrl');
    shortUrlLink.href = data.shortUrl;
    shortUrlLink.textContent = data.shortUrl;
    
    document.getElementById('qrCodeImage').src = data.qrCode;
    document.getElementById('clicks').textContent = data.clicks;
    
    const statsLink = document.getElementById('statsLink');
    statsLink.href = `/stats/${data.shortCode}`;
    
    // Esconder formulário e mostrar resultado
    document.querySelector('.form-container').style.display = 'none';
    resultContainer.style.display = 'block';
    
    // Scroll suave para o resultado
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Copiar para área de transferência
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.href;
    
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiado!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar para área de transferência');
    });
}

// Download do QR Code
function downloadQRCode() {
    const qrCodeImage = document.getElementById('qrCodeImage');
    const shortUrl = document.getElementById('shortUrl').textContent;
    const shortCode = shortUrl.split('/').pop();
    
    const link = document.createElement('a');
    link.href = qrCodeImage.src;
    link.download = `qrcode-${shortCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Resetar formulário
function resetForm() {
    urlInput.value = '';
    clearError();
    document.querySelector('.form-container').style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Permitir tecla Enter no input
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenForm.dispatchEvent(new Event('submit'));
    }
});
