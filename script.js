class WhiteBackgroundRemover {
    constructor() {
        this.originalImage = null;
        this.originalCanvas = null;
        this.resultCanvas = null;
        this.originalCtx = null;
        this.resultCtx = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Elements DOM
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.resetSection = document.getElementById('resetSection');
        
        // Canvas
        this.originalCanvas = document.getElementById('originalCanvas');
        this.resultCanvas = document.getElementById('resultCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.resultCtx = this.resultCanvas.getContext('2d');
        
        // Contrôles
        this.thresholdSlider = document.getElementById('thresholdSlider');
        this.toleranceSlider = document.getElementById('toleranceSlider');
        this.smoothEdges = document.getElementById('smoothEdges');
        this.processBtn = document.getElementById('processBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Contrôles mode sélection
        this.selectionModeBtn = document.getElementById('selectionModeBtn');
        this.selectionToleranceSlider = document.getElementById('selectionToleranceSlider');
        this.selectionToleranceGroup = document.getElementById('selectionToleranceGroup');
        this.selectionToleranceValue = document.getElementById('selectionToleranceValue');
        
        // État du mode sélection
        this.selectionMode = false;
        
        // Valeurs affichées
        this.thresholdValue = document.getElementById('thresholdValue');
        this.toleranceValue = document.getElementById('toleranceValue');
    }

    bindEvents() {
        // Upload events
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag & Drop
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // Slider events
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = e.target.value;
        });
        this.toleranceSlider.addEventListener('input', (e) => {
            this.toleranceValue.textContent = e.target.value;
        });
        this.selectionToleranceSlider.addEventListener('input', (e) => {
            this.selectionToleranceValue.textContent = e.target.value;
        });
        
        // Button events
        this.processBtn.addEventListener('click', () => this.processImage());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.selectionModeBtn.addEventListener('click', () => this.toggleSelectionMode());
        
        // Canvas click events
        this.resultCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && this.isValidImageFile(files[0])) {
            this.loadImage(files[0]);
        } else {
            this.showError('Veuillez sélectionner un fichier image valide (PNG, JPG, JPEG)');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && this.isValidImageFile(file)) {
            this.loadImage(file);
        } else {
            this.showError('Veuillez sélectionner un fichier image valide (PNG, JPG, JPEG)');
        }
    }

    isValidImageFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        return validTypes.includes(file.type);
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.setupCanvases();
                this.showControls();
            };
            img.onerror = () => {
                this.showError('Erreur lors du chargement de l\'image');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showError('Erreur lors de la lecture du fichier');
        };
        reader.readAsDataURL(file);
    }

    setupCanvases() {
        const maxSize = 500; // Taille max pour l'aperçu
        let { width, height } = this.originalImage;
        
        // Redimensionner si nécessaire pour l'aperçu
        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width *= ratio;
            height *= ratio;
        }
        
        // Configuration des canvas
        this.originalCanvas.width = width;
        this.originalCanvas.height = height;
        this.resultCanvas.width = width;
        this.resultCanvas.height = height;
        
        // Dessiner l'image originale
        this.originalCtx.drawImage(this.originalImage, 0, 0, width, height);
        
        // Copier vers le canvas de résultat
        this.resultCtx.drawImage(this.originalCanvas, 0, 0);
    }

    showControls() {
        this.controlsSection.style.display = 'block';
        this.previewSection.style.display = 'block';
        this.resetSection.style.display = 'block';
    }

    processImage() {
        if (!this.originalImage) return;
        
        this.processBtn.disabled = true;
        this.processBtn.textContent = 'Traitement...';
        
        // Utiliser setTimeout pour permettre l'affichage du message
        setTimeout(() => {
            try {
                this.removeWhiteBackground();
                this.processBtn.textContent = 'Traiter l\'image';
            } catch (error) {
                this.showError('Erreur lors du traitement: ' + error.message);
                this.processBtn.textContent = 'Traiter l\'image';
            } finally {
                this.processBtn.disabled = false;
            }
        }, 50);
    }

    removeWhiteBackground() {
        const threshold = parseInt(this.thresholdSlider.value);
        const tolerance = parseInt(this.toleranceSlider.value);
        const smoothEdges = this.smoothEdges.checked;
        
        // Redessiner l'image originale
        const { width, height } = this.originalCanvas;
        this.resultCtx.clearRect(0, 0, width, height);
        this.resultCtx.drawImage(this.originalCanvas, 0, 0);
        
        // Obtenir les données d'image
        const imageData = this.resultCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Traiter chaque pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            // Vérifier si le pixel est proche du blanc
            if (this.isWhitePixel(r, g, b, threshold, tolerance)) {
                // Rendre transparent
                data[i + 3] = 0;
            } else if (smoothEdges && alpha > 0) {
                // Ajustement des bords pour un effet plus lisse
                const whiteness = this.calculateWhiteness(r, g, b);
                if (whiteness > threshold - tolerance * 2) {
                    const fadeAmount = Math.max(0, (whiteness - (threshold - tolerance * 2)) / (tolerance * 2));
                    data[i + 3] = Math.round(alpha * (1 - fadeAmount));
                }
            }
        }
        
        // Appliquer les modifications
        this.resultCtx.putImageData(imageData, 0, 0);
    }

    isWhitePixel(r, g, b, threshold, tolerance) {
        // Calculer la luminosité moyenne
        const brightness = (r + g + b) / 3;
        
        // Vérifier si tous les composants sont au-dessus du seuil
        const minComponent = Math.min(r, g, b);
        const maxComponent = Math.max(r, g, b);
        
        // Pixel considéré comme blanc si:
        // 1. La luminosité est au-dessus du seuil
        // 2. La différence entre composants est faible (couleur proche du gris/blanc)
        return brightness >= threshold && 
               minComponent >= threshold - tolerance && 
               (maxComponent - minComponent) <= tolerance;
    }

    calculateWhiteness(r, g, b) {
        // Retourne une valeur de "blancheur" entre 0 et 255
        return (r + g + b) / 3;
    }

    downloadResult() {
        if (!this.resultCanvas) return;
        
        // Créer un canvas à la taille originale pour le téléchargement
        const downloadCanvas = document.createElement('canvas');
        const downloadCtx = downloadCanvas.getContext('2d');
        
        // Taille originale de l'image
        downloadCanvas.width = this.originalImage.width;
        downloadCanvas.height = this.originalImage.height;
        
        // Redessiner l'image à la taille originale
        downloadCtx.drawImage(this.originalImage, 0, 0);
        
        // Appliquer le traitement à la taille originale
        this.applyProcessingToCanvas(downloadCanvas, downloadCtx);
        
        // Créer le lien de téléchargement
        downloadCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image_sans_fond_blanc.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    applyProcessingToCanvas(canvas, ctx) {
        const threshold = parseInt(this.thresholdSlider.value);
        const tolerance = parseInt(this.toleranceSlider.value);
        const smoothEdges = this.smoothEdges.checked;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            if (this.isWhitePixel(r, g, b, threshold, tolerance)) {
                data[i + 3] = 0;
            } else if (smoothEdges && alpha > 0) {
                const whiteness = this.calculateWhiteness(r, g, b);
                if (whiteness > threshold - tolerance * 2) {
                    const fadeAmount = Math.max(0, (whiteness - (threshold - tolerance * 2)) / (tolerance * 2));
                    data[i + 3] = Math.round(alpha * (1 - fadeAmount));
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    reset() {
        this.originalImage = null;
        this.controlsSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.resetSection.style.display = 'none';
        this.fileInput.value = '';
        
        // Reset des sliders
        this.thresholdSlider.value = 240;
        this.toleranceSlider.value = 10;
        this.thresholdValue.textContent = '240';
        this.toleranceValue.textContent = '10';
        this.smoothEdges.checked = true;
        
        // Reset du mode sélection
        this.selectionMode = false;
        this.selectionModeBtn.classList.remove('active');
        this.selectionModeBtn.textContent = '🎯 Mode sélection de zone';
        this.selectionToleranceGroup.style.display = 'none';
        this.previewSection.classList.remove('selection-cursor');
        this.selectionToleranceSlider.value = 20;
        this.selectionToleranceValue.textContent = '20';
    }

    toggleSelectionMode() {
        this.selectionMode = !this.selectionMode;
        
        if (this.selectionMode) {
            this.selectionModeBtn.classList.add('active');
            this.selectionModeBtn.textContent = '✅ Mode sélection actif';
            this.selectionToleranceGroup.style.display = 'block';
            this.previewSection.classList.add('selection-cursor');
        } else {
            this.selectionModeBtn.classList.remove('active');
            this.selectionModeBtn.textContent = '🎯 Mode sélection de zone';
            this.selectionToleranceGroup.style.display = 'none';
            this.previewSection.classList.remove('selection-cursor');
        }
    }

    handleCanvasClick(e) {
        if (!this.selectionMode || !this.originalImage) return;
        
        const rect = this.resultCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.resultCanvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.resultCanvas.height / rect.height));
        
        // Vérifier que le clic est dans les limites du canvas
        if (x >= 0 && x < this.resultCanvas.width && y >= 0 && y < this.resultCanvas.height) {
            const tolerance = parseInt(this.selectionToleranceSlider.value);
            this.floodFillTransparent(x, y, tolerance);
        }
    }

    floodFillTransparent(xStart, yStart, tolerance) {
        const canvas = this.resultCanvas;
        const ctx = this.resultCtx;
        const { width, height } = canvas;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Convertir slider -> distance max au carré
        const MAX_D2 = 195075; // 3 * 255^2
        const maxD2 = Math.pow(tolerance / 100, 2) * MAX_D2;

        const idx = (x, y) => (y * width + x) * 4;

        const i0 = idx(xStart, yStart);
        const r0 = data[i0], g0 = data[i0 + 1], b0 = data[i0 + 2];
        
        // Si le pixel de départ est déjà transparent, ne rien faire
        if (data[i0 + 3] === 0) return;

        const visited = new Uint8Array(width * height);
        const stack = [[xStart, yStart]];
        visited[yStart * width + xStart] = 1;

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const i = idx(x, y);
            
            // Si le pixel est déjà transparent, passer au suivant
            if (data[i + 3] === 0) continue;
            
            const dr = data[i] - r0;
            const dg = data[i + 1] - g0;
            const db = data[i + 2] - b0;
            const d2 = dr * dr + dg * dg + db * db;
            
            if (d2 <= maxD2) {
                // Rendre transparent
                data[i + 3] = 0;

                // Voisins (4-connexe)
                if (x > 0 && !visited[y * width + (x - 1)]) {
                    visited[y * width + (x - 1)] = 1;
                    stack.push([x - 1, y]);
                }
                if (x + 1 < width && !visited[y * width + (x + 1)]) {
                    visited[y * width + (x + 1)] = 1;
                    stack.push([x + 1, y]);
                }
                if (y > 0 && !visited[(y - 1) * width + x]) {
                    visited[(y - 1) * width + x] = 1;
                    stack.push([x, y - 1]);
                }
                if (y + 1 < height && !visited[(y + 1) * width + x]) {
                    visited[(y + 1) * width + x] = 1;
                    stack.push([x, y + 1]);
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    showError(message) {
        alert(message); // Simple pour l'instant, pourrait être amélioré avec une notification
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    new WhiteBackgroundRemover();
});