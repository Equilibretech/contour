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
        
        // Canvas supplémentaires pour overlays
        this.maskCanvas = null;
        this.maskCtx = null;
        this.uiCanvas = null;
        this.uiCtx = null;
        
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
        this.freehandMode = false;
        
        // Données de sélection libre
        this.isDrawing = false;
        this.drawingPath = [];
        this.insideMask = null;
        this.selectionMask = null;
        this.referenceColor = null;
        
        // Nouveaux contrôles
        this.freehandModeBtn = document.getElementById('freehandModeBtn');
        this.freehandActionsGroup = document.getElementById('freehandActionsGroup');
        this.applyBtn = document.getElementById('applyBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
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
        this.freehandModeBtn.addEventListener('click', () => this.toggleFreehandMode());
        this.applyBtn.addEventListener('click', () => this.applyFreehandSelection());
        this.cancelBtn.addEventListener('click', () => this.cancelFreehandSelection());
        
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
        
        // Initialiser les canvas supplémentaires
        this.maskCanvas = document.getElementById('maskCanvas');
        this.uiCanvas = document.getElementById('uiCanvas');
        this.maskCtx = this.maskCanvas.getContext('2d');
        this.uiCtx = this.uiCanvas.getContext('2d');
        
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
        this.uiCanvas.width = width;
        this.uiCanvas.height = height;
        
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
        
        // Reset du mode sélection libre
        this.freehandMode = false;
        this.freehandModeBtn.classList.remove('active');
        this.freehandModeBtn.textContent = '✏️ Sélection libre';
        this.freehandActionsGroup.style.display = 'none';
        this.previewSection.classList.remove('freehand-cursor');
        this.cancelFreehandSelection();
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

    toggleFreehandMode() {
        this.freehandMode = !this.freehandMode;
        
        // Désactiver le mode sélection si actif
        if (this.freehandMode && this.selectionMode) {
            this.toggleSelectionMode();
        }
        
        if (this.freehandMode) {
            this.freehandModeBtn.classList.add('active');
            this.freehandModeBtn.textContent = '✅ Mode sélection libre actif';
            this.selectionToleranceGroup.style.display = 'block';
            this.freehandActionsGroup.style.display = 'block';
            this.previewSection.classList.add('freehand-cursor');
            
            // Ajouter les event listeners pour le dessin
            this.uiCanvas.style.pointerEvents = 'auto';
            this.uiCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
            this.uiCanvas.addEventListener('mousemove', this.draw.bind(this));
            this.uiCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
            this.uiCanvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        } else {
            this.freehandModeBtn.classList.remove('active');
            this.freehandModeBtn.textContent = '✏️ Sélection libre';
            this.selectionToleranceGroup.style.display = 'none';
            this.freehandActionsGroup.style.display = 'none';
            this.previewSection.classList.remove('freehand-cursor');
            
            // Retirer les event listeners
            this.uiCanvas.style.pointerEvents = 'none';
            this.uiCanvas.removeEventListener('mousedown', this.startDrawing.bind(this));
            this.uiCanvas.removeEventListener('mousemove', this.draw.bind(this));
            this.uiCanvas.removeEventListener('mouseup', this.stopDrawing.bind(this));
            this.uiCanvas.removeEventListener('mouseleave', this.stopDrawing.bind(this));
            
            // Nettoyer
            this.cancelFreehandSelection();
        }
    }

    startDrawing(e) {
        if (!this.freehandMode) return;
        
        this.isDrawing = true;
        this.drawingPath = [];
        
        const rect = this.uiCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.uiCanvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.uiCanvas.height / rect.height));
        
        this.drawingPath.push({x, y});
        
        // Nettoyer les canvas
        this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    }

    draw(e) {
        if (!this.isDrawing || !this.freehandMode) return;
        
        const rect = this.uiCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.uiCanvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.uiCanvas.height / rect.height));
        
        this.drawingPath.push({x, y});
        
        // Dessiner le tracé
        this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        this.uiCtx.strokeStyle = '#FF5722';
        this.uiCtx.lineWidth = 2;
        this.uiCtx.lineJoin = 'round';
        this.uiCtx.lineCap = 'round';
        
        this.uiCtx.beginPath();
        this.uiCtx.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);
        
        for (let i = 1; i < this.drawingPath.length; i++) {
            this.uiCtx.lineTo(this.drawingPath[i].x, this.drawingPath[i].y);
        }
        
        this.uiCtx.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing || this.drawingPath.length < 3) {
            this.isDrawing = false;
            return;
        }
        
        this.isDrawing = false;
        
        // Fermer le tracé
        this.uiCtx.closePath();
        this.uiCtx.stroke();
        
        // Créer le masque intérieur et calculer la couleur de référence
        this.createInsideMask();
        this.calculateReferenceColor();
        this.updateSelectionPreview();
    }

    createInsideMask() {
        const width = this.uiCanvas.width;
        const height = this.uiCanvas.height;
        this.insideMask = new Uint8Array(width * height);
        
        // Utiliser Path2D pour le test point-in-polygon
        const path = new Path2D();
        path.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);
        
        for (let i = 1; i < this.drawingPath.length; i++) {
            path.lineTo(this.drawingPath[i].x, this.drawingPath[i].y);
        }
        path.closePath();
        
        // Tester chaque pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (this.uiCtx.isPointInPath(path, x, y)) {
                    this.insideMask[y * width + x] = 1;
                }
            }
        }
    }

    calculateReferenceColor() {
        if (!this.drawingPath.length) return;
        
        const imgData = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.resultCanvas.height);
        const data = imgData.data;
        
        let r = 0, g = 0, b = 0, count = 0;
        
        // Calculer la moyenne des couleurs sur le tracé
        for (const point of this.drawingPath) {
            const idx = (point.y * this.resultCanvas.width + point.x) * 4;
            if (data[idx + 3] > 0) { // Ignorer les pixels transparents
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
            }
        }
        
        if (count > 0) {
            this.referenceColor = {
                r: Math.round(r / count),
                g: Math.round(g / count),
                b: Math.round(b / count)
            };
        }
    }

    updateSelectionPreview() {
        if (!this.referenceColor || !this.insideMask) return;
        
        const tolerance = parseInt(this.selectionToleranceSlider.value);
        const MAX_D2 = 195075; // 3 * 255^2
        const maxD2 = Math.pow(tolerance / 100, 2) * MAX_D2;
        
        const width = this.maskCanvas.width;
        const height = this.maskCanvas.height;
        
        const imgData = this.resultCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        // Créer le masque de sélection
        this.selectionMask = new Uint8Array(width * height);
        
        // Créer l'overlay rouge
        const overlayData = this.maskCtx.createImageData(width, height);
        const overlay = overlayData.data;
        
        for (let i = 0; i < width * height; i++) {
            if (this.insideMask[i] === 1) {
                const idx = i * 4;
                const dr = data[idx] - this.referenceColor.r;
                const dg = data[idx + 1] - this.referenceColor.g;
                const db = data[idx + 2] - this.referenceColor.b;
                const d2 = dr * dr + dg * dg + db * db;
                
                if (d2 <= maxD2 && data[idx + 3] > 0) {
                    this.selectionMask[i] = 1;
                    // Overlay rouge semi-transparent
                    overlay[idx] = 255;
                    overlay[idx + 1] = 0;
                    overlay[idx + 2] = 0;
                    overlay[idx + 3] = 90;
                }
            }
        }
        
        this.maskCtx.putImageData(overlayData, 0, 0);
    }

    applyFreehandSelection() {
        if (!this.selectionMask) return;
        
        const imgData = this.resultCtx.getImageData(0, 0, this.resultCanvas.width, this.resultCanvas.height);
        const data = imgData.data;
        
        // Appliquer la transparence aux pixels sélectionnés
        for (let i = 0; i < this.selectionMask.length; i++) {
            if (this.selectionMask[i] === 1) {
                data[i * 4 + 3] = 0;
            }
        }
        
        this.resultCtx.putImageData(imgData, 0, 0);
        
        // Nettoyer
        this.cancelFreehandSelection();
    }

    cancelFreehandSelection() {
        this.drawingPath = [];
        this.insideMask = null;
        this.selectionMask = null;
        this.referenceColor = null;
        
        // Nettoyer les canvas
        if (this.uiCtx) {
            this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        }
        if (this.maskCtx) {
            this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        }
    }

    showError(message) {
        alert(message); // Simple pour l'instant, pourrait être amélioré avec une notification
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const app = new WhiteBackgroundRemover();
    
    // Gestion des tooltips
    document.querySelectorAll('.param .help').forEach(btn => {
        const tipId = btn.getAttribute('aria-describedby');
        const tip = document.getElementById(tipId);
        if (!tip) return;
        
        const show = () => { tip.hidden = false; };
        const hide = () => { tip.hidden = true; };
        
        btn.addEventListener('mouseenter', show);
        btn.addEventListener('mouseleave', hide);
        btn.addEventListener('focus', show);
        btn.addEventListener('blur', hide);
        btn.addEventListener('keydown', e => { 
            if (e.key === 'Escape') hide(); 
        });
        
        // Support mobile
        let tapCount = 0;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tapCount++;
            if (tapCount === 1) {
                show();
                setTimeout(() => { tapCount = 0; }, 2000);
            } else {
                hide();
                tapCount = 0;
            }
        });
    });
    
    // Mise à jour dynamique avec tolérance de sélection
    document.getElementById('selectionToleranceSlider').addEventListener('input', () => {
        if (app.freehandMode && app.referenceColor) {
            app.updateSelectionPreview();
        }
    });
});