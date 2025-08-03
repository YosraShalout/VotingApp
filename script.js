document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const candidatesGrid = document.getElementById('candidatesGrid');
    const addCandidateBtn = document.getElementById('addCandidate');
    const candidateNameInput = document.getElementById('candidateName');
    const saveDataBtn = document.getElementById('saveData');
    const loadDataBtn = document.getElementById('loadData');
    const exportExcelBtn = document.getElementById('exportExcel');
    const resetAllBtn = document.getElementById('resetAll');
    const helpBtn = document.getElementById('helpBtn');
    const totalCandidatesSpan = document.getElementById('totalCandidates');
    const totalVotesSpan = document.getElementById('totalVotes');
    const helpModal = document.getElementById('helpModal');
    const closeModal = document.querySelector('.close-modal');

    // Candidates data
    let candidates = JSON.parse(localStorage.getItem('votingAppCandidates')) || [];

    // Initialize the app
    function initApp() {
        updateStats();
        renderCandidates();
    }

    // Update statistics
    function updateStats() {
        totalCandidatesSpan.textContent = candidates.length;
        totalVotesSpan.textContent = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
    }

    // Render candidates grid
    function renderCandidates() {
        candidatesGrid.innerHTML = '';
        
        candidates.forEach((candidate, index) => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            card.innerHTML = `
                <div class="serial-number">${index + 1}</div>
                <div class="vote-count">${candidate.votes}</div>
                <div class="candidate-name">${candidate.name}</div>
                <div class="card-actions">
                    <button class="btn-danger remove-vote" data-index="${index}">
                        <i class="fas fa-minus"></i> إزالة
                    </button>
                    <button class="btn-success remove-candidate" data-index="${index}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                // Don't count vote if clicking on buttons
                if (!e.target.closest('button')) {
                    addVote(index);
                }
            });
            
            candidatesGrid.appendChild(card);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.remove-vote').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeVote(parseInt(this.dataset.index));
            });
        });

        document.querySelectorAll('.remove-candidate').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeCandidate(parseInt(this.dataset.index));
            });
        });

        updateStats();
    }

    // Add a new candidate
    function addCandidate() {
        const name = candidateNameInput.value.trim();
        
        if (name) {
            // Check if candidate already exists
            if (!candidates.some(c => c.name === name)) {
                candidates.push({
                    name: name,
                    votes: 0
                });
                
                saveToLocalStorage();
                renderCandidates();
                candidateNameInput.value = '';
                candidateNameInput.focus();
                showAlert('تم إضافة المرشح بنجاح', 'success');
            } else {
                showAlert('هذا المرشح موجود بالفعل!', 'warning');
            }
        } else {
            showAlert('الرجاء إدخال اسم المرشح', 'error');
        }
    }

    // Add a vote to a candidate
    function addVote(index) {
        candidates[index].votes++;
        saveToLocalStorage();
        renderCandidates();
        showAlert(`تم إضافة صوت للمرشح ${candidates[index].name}`, 'success');
    }

    // Remove a vote from a candidate
    function removeVote(index) {
        if (candidates[index].votes > 0) {
            if (confirm(`هل تريد حذف صوت من المرشح ${candidates[index].name}؟`)) {
                candidates[index].votes--;
                saveToLocalStorage();
                renderCandidates();
                showAlert(`تم حذف صوت من المرشح ${candidates[index].name}`, 'success');
            }
        } else {
            showAlert('لا يوجد أصوات لحذفها', 'warning');
        }
    }

    // Remove a candidate
    function removeCandidate(index) {
        if (confirm(`هل أنت متأكد من حذف المرشح ${candidates[index].name}؟ سيتم حذف جميع أصواته أيضًا.`)) {
            const removedCandidate = candidates[index].name;
            candidates.splice(index, 1);
            saveToLocalStorage();
            renderCandidates();
            showAlert(`تم حذف المرشح ${removedCandidate}`, 'success');
        }
    }

    // Reset all data (candidates and votes)
    function resetAll() {
        if (confirm('هل أنت متأكد من مسح كل شيء؟ سيتم حذف جميع المرشحين والأصوات والإعدادات!')) {
            candidates = [];
            localStorage.removeItem('votingAppCandidates');
            renderCandidates();
            showAlert('تم مسح جميع البيانات بنجاح', 'success');
        }
    }

    // Save data to localStorage
    function saveToLocalStorage() {
        localStorage.setItem('votingAppCandidates', JSON.stringify(candidates));
    }

    // Load data from localStorage
    function loadFromLocalStorage() {
        candidates = JSON.parse(localStorage.getItem('votingAppCandidates')) || [];
        renderCandidates();
    }

    // Export to Excel
    function exportToExcel() {
        try {
            // Prepare data
            const data = [
                ['#', 'اسم المرشح', 'عدد الأصوات'], // Header row
                ...candidates.map((c, index) => [index + 1, c.name, c.votes])
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "نتائج التصويت");

            // Export
            XLSX.writeFile(wb, "نتائج_التصويت.xlsx");
            showAlert('تم تصدير البيانات إلى Excel بنجاح', 'success');
        } catch (error) {
            showAlert('حدث خطأ أثناء التصدير: ' + error.message, 'error');
        }
    }

    // Save data to JSON file
    function saveDataToFile() {
        const data = JSON.stringify(candidates, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voting_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('تم حفظ البيانات في ملف JSON بنجاح', 'success');
    }

    // Load data from JSON file
    function loadDataFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            
            // Check file size (max 1MB)
            if (file.size > 1024 * 1024) {
                showAlert('حجم الملف كبير جداً (الحد الأقصى 1MB)', 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (Array.isArray(data)) {
                        candidates = data;
                        saveToLocalStorage();
                        renderCandidates();
                        showAlert('تم تحميل البيانات بنجاح', 'success');
                    } else {
                        showAlert('ملف غير صالح. يجب أن يحتوي على مصفوفة من المرشحين.', 'error');
                    }
                } catch (error) {
                    showAlert('خطأ في قراءة الملف: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Show alert message
    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    // Help modal functions
    function openHelpModal() {
        helpModal.style.display = 'block';
    }

    function closeHelpModal() {
        helpModal.style.display = 'none';
    }

    // Event listeners
    addCandidateBtn.addEventListener('click', addCandidate);
    
    candidateNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addCandidate();
        }
    });

    saveDataBtn.addEventListener('click', saveDataToFile);
    loadDataBtn.addEventListener('click', loadDataFromFile);
    exportExcelBtn.addEventListener('click', exportToExcel);
    resetAllBtn.addEventListener('click', resetAll);
    helpBtn.addEventListener('click', openHelpModal);
    closeModal.addEventListener('click', closeHelpModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            closeHelpModal();
        }
    });

    // Initialize the app
    initApp();
});
