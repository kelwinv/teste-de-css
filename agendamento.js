(function () {
    const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];
    const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

    const SERVICE_LABELS = {
        corte: 'Corte',
        barba: 'Barba',
        combo: 'Corte + Barba',
        infantil: 'Infantil',
    };

    const form = document.getElementById('booking-form');
    const dateContainer = document.getElementById('date-options');
    const timeContainer = document.getElementById('time-slots');
    const modal = document.getElementById('success-modal');
    const modalDetails = document.getElementById('modal-details');
    const modalClose = document.getElementById('modal-close');
    const formError = document.getElementById('form-error');
    const mobileCtaMeta = document.getElementById('mobile-cta-meta');
    const mobileCtaTotal = document.getElementById('mobile-cta-total');

    let selectedDate = null;

    function isMobileLayout() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function showFormError(message) {
        if (!formError) {
            alert(message);
            return;
        }
        formError.textContent = message;
        formError.hidden = false;
        formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearFormError() {
        if (formError) formError.hidden = true;
    }

    function scrollDateChipIntoView(input) {
        if (!input || !isMobileLayout()) return;
        const chip = input.closest('.date-chip');
        if (chip) {
            chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }

    function formatCurrency(value) {
        return 'R$ ' + value.toFixed(0).replace('.', ',');
    }

    function getSelectedService() {
        return form.querySelector('input[name="service"]:checked');
    }

    function getSelectedBarber() {
        return form.querySelector('input[name="barber"]:checked');
    }

    function getSelectedDateInput() {
        return form.querySelector('input[name="date"]:checked');
    }

    function getSelectedTimeInput() {
        return form.querySelector('input[name="time"]:checked');
    }

    function buildDates() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const isSunday = d.getDay() === 0;
            if (isSunday) continue;

            const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            const id = 'date-' + iso;
            const chip = document.createElement('div');
            chip.className = 'date-chip';
            chip.innerHTML =
                '<input type="radio" name="date" id="' +
                id +
                '" value="' +
                iso +
                '" data-label="' +
                WEEKDAYS[d.getDay()] +
                ', ' +
                d.getDate() +
                ' ' +
                MONTHS[d.getMonth()] +
                '">' +
                '<label for="' +
                id +
                '">' +
                '<span class="date-day">' +
                (i === 0 ? 'Hoje' : WEEKDAYS[d.getDay()]) +
                '</span>' +
                '<span class="date-num">' +
                d.getDate() +
                '</span>' +
                '<span class="date-month">' +
                MONTHS[d.getMonth()] +
                '</span>' +
                '</label>';
            fragment.appendChild(chip);
        }

        dateContainer.appendChild(fragment);
        const first = dateContainer.querySelector('input[name="date"]');
        if (first) {
            first.checked = true;
            selectedDate = first.value;
            renderTimeSlots();
            scrollDateChipIntoView(first);
        }
    }

    function isSlotUnavailable(slot, dateIso) {
        const hash = (dateIso + slot).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return hash % 7 === 0;
    }

    function renderTimeSlots() {
        const dateInput = getSelectedDateInput();
        const dateIso = dateInput ? dateInput.value : '';
        timeContainer.innerHTML = '';

        ALL_SLOTS.forEach(function (slot, index) {
            const id = 'time-' + slot.replace(':', '');
            const unavailable = isSlotUnavailable(slot, dateIso);
            const slotEl = document.createElement('div');
            slotEl.className = 'time-slot';
            slotEl.innerHTML =
                '<input type="radio" name="time" id="' +
                id +
                '" value="' +
                slot +
                '"' +
                (unavailable ? ' disabled' : '') +
                (index === 2 && !unavailable ? ' checked' : '') +
                '>' +
                '<label for="' +
                id +
                '">' +
                slot +
                '</label>';
            timeContainer.appendChild(slotEl);
        });

        const checked = timeContainer.querySelector('input[name="time"]:checked:not(:disabled)');
        if (!checked) {
            const firstFree = timeContainer.querySelector('input[name="time"]:not(:disabled)');
            if (firstFree) firstFree.checked = true;
        }

        updateSummary();
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function updateSummary() {
        const service = getSelectedService();
        const barber = getSelectedBarber();
        const dateInput = getSelectedDateInput();
        const timeInput = getSelectedTimeInput();

        const serviceLabel = service
            ? SERVICE_LABELS[service.value] || service.value
            : '—';
        const barberLabel = barber ? barber.value : '—';
        const dateLabel = dateInput ? dateInput.dataset.label : '—';
        const timeLabel = timeInput ? timeInput.value : '—';
        const durationLabel = service ? service.dataset.duration + ' min' : '—';
        const totalLabel = service
            ? formatCurrency(parseFloat(service.dataset.price, 10))
            : '—';

        setText('summary-service', serviceLabel);
        setText('summary-duration', durationLabel);
        setText('summary-total', totalLabel);
        setText('summary-barber', barberLabel);
        setText('summary-date', dateLabel);
        setText('summary-time', timeLabel);

        if (mobileCtaMeta) {
            const when =
                dateLabel !== '—' && timeLabel !== '—'
                    ? dateLabel + ' às ' + timeLabel
                    : 'escolha data e horário';
            mobileCtaMeta.textContent = serviceLabel + ' · ' + when;
        }
        if (mobileCtaTotal) {
            mobileCtaTotal.textContent = totalLabel;
        }
    }

    function openModal(data) {
        modalDetails.innerHTML =
            '<p><strong>Serviço:</strong> ' +
            data.service +
            '</p>' +
            '<p><strong>Profissional:</strong> ' +
            data.barber +
            '</p>' +
            '<p><strong>Data:</strong> ' +
            data.date +
            ' às ' +
            data.time +
            '</p>' +
            '<p><strong>Cliente:</strong> ' +
            data.name +
            '</p>' +
            '<p><strong>Telefone:</strong> ' +
            data.phone +
            '</p>';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    dateContainer.addEventListener('change', function (e) {
        if (e.target.name === 'date') {
            selectedDate = e.target.value;
            renderTimeSlots();
            scrollDateChipIntoView(e.target);
            clearFormError();
        }
    });

    timeContainer.addEventListener('change', updateSummary);

    form.addEventListener('change', function (e) {
        if (e.target.name === 'service' || e.target.name === 'barber' || e.target.name === 'time') {
            updateSummary();
            clearFormError();
        }
    });

    form.addEventListener('input', function () {
        clearFormError();
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('client-name').value.trim();
        const phone = document.getElementById('client-phone').value.trim();
        const service = getSelectedService();
        const barber = getSelectedBarber();
        const dateInput = getSelectedDateInput();
        const timeInput = getSelectedTimeInput();

        clearFormError();

        if (!name || !phone) {
            showFormError('Preencha nome e telefone para continuar.');
            document.getElementById(!name ? 'client-name' : 'client-phone').focus();
            return;
        }

        if (!dateInput || !timeInput) {
            showFormError('Selecione data e horário antes de confirmar.');
            document.getElementById('date-options').scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        openModal({
            service: SERVICE_LABELS[service.value],
            barber: barber.value,
            date: dateInput.dataset.label,
            time: timeInput.value,
            name: name,
            phone: phone,
        });

        form.reset();
        const firstService = form.querySelector('input[name="service"]');
        const firstBarber = form.querySelector('input[name="barber"]');
        if (firstService) firstService.checked = true;
        if (firstBarber) firstBarber.checked = true;
        const firstDate = dateContainer.querySelector('input[name="date"]');
        if (firstDate) {
            firstDate.checked = true;
            renderTimeSlots();
        }
        updateSummary();
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    buildDates();
    updateSummary();
})();
