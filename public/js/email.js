export function initContactModal() {
    const contactBtn = document.getElementById('nav-contact-btn');
    const modal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form');
    const modalContent = document.querySelector('.modal-content');
    let scrollPosition = 0;  /* Capture scroll position for restore */

    if (!contactBtn || !modal || !contactForm || !modalContent) return;

    // Preserve the original markup so the form can be restored after a submit
    if (!window.originalModalHTML) {
        window.originalModalHTML = modalContent.innerHTML;
    }

    // Keyboard handler scoped for this modal instance. Handles Escape + Tab focus trap.
    function handleKeydown(e) {
        if (e.key === 'Escape' && !modal.hasAttribute('inert')) {
            e.preventDefault();
            closeModal();
            return;
        }

        if (e.key === 'Tab' && !modal.hasAttribute('inert')) {
            const focusable = modal.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
            const nodes = Array.prototype.slice.call(focusable).filter(n => n.offsetParent !== null);
            if (nodes.length === 0) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    // 1. OPEN MODAL INTERACTION
    contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollPosition = window.scrollY;
        requestAnimationFrame(() => {
            modal.classList.add('is-active');
            document.body.classList.add('no-scroll');
            modal.removeAttribute('inert');
            // Move focus into the dialog for accessibility
            modalContent.setAttribute('tabindex', '-1');
            modalContent.focus();
        });
        document.addEventListener('keydown', handleKeydown);
    });

    // 2. CLOSE MODAL & RESTORE FORM LAYOUT
    const closeModal = () => {
        modal.classList.remove('is-active');
        modal.setAttribute('inert', '');
        document.body.classList.remove('no-scroll');
        window.scrollTo(0, scrollPosition);

        // Remove keyboard handler immediately to avoid races with DOM replacement
        document.removeEventListener('keydown', handleKeydown);

        // Wait for the CSS fade-out transition to complete before flipping the DOM nodes
        setTimeout(() => {
            modalContent.innerHTML = window.originalModalHTML;
            initContactModal(); // Re-bind event handlers to the new form elements
        }, 250);

        contactBtn.focus();
    };

    // Handle close button and background clicks via event delegation
    modalContent.addEventListener('click', (e) => {
        if (e.target.id === 'close-modal-btn') closeModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 3. INTERCEPT AND SEND SILENTLY IN BACKGROUND
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.form-submit-btn');
        const inputName = document.getElementById('contact-name')?.value || '';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "DISPATCHING...";
            submitBtn.style.opacity = "0.5";
        }

        try {
            // Wrap FormData in URLSearchParams for JSON/WWW form compatibility
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new URLSearchParams(new FormData(contactForm)),
                headers: { 'Accept': 'application/json' }
            });

            // Show a small verification message and close the modal shortly after
            modalContent.innerHTML = '';
            const closeBtnSec = document.createElement('button');
            closeBtnSec.id = 'close-modal-btn';
            closeBtnSec.className = 'close-btn';
            closeBtnSec.innerHTML = '&times;';

            const container = document.createElement('div');
            container.style.cssText = 'text-align: center; padding: 2rem 0; display: flex; flex-direction: column; gap: 1rem; align-items: center;';

            const iconNode = document.createElement('div');
            iconNode.style.cssText = 'font-size: 2.5rem; color: var(--color-secondary-text);';

            const titleNode = document.createElement('h3');
            titleNode.className = 'modal-title';
            titleNode.style.cssText = 'margin: 0;';

            const subtitleNode = document.createElement('p');
            subtitleNode.className = 'modal-subtitle';
            subtitleNode.style.cssText = 'margin: 0; opacity: 0.7;';

            if (response.ok) {
                iconNode.textContent = '✓';
                titleNode.textContent = 'Message Dispatched';
                subtitleNode.textContent = `Thanks ${inputName}. The payload has been logged successfully.`;
            } else {
                iconNode.textContent = '✕';
                iconNode.style.color = 'hsl(0, 70%, 50%)';
                titleNode.textContent = 'Transmission Error';
                subtitleNode.textContent = 'Formspree rejected the request. Please try again.';
            }

            container.appendChild(iconNode);
            container.appendChild(titleNode);
            container.appendChild(subtitleNode);
            modalContent.appendChild(closeBtnSec);
            modalContent.appendChild(container);

            // Automatically close the window after 3 seconds
            setTimeout(closeModal, 3000);

        } catch (error) {
            // Local testing or network error; show a helpful message
            console.warn("Local testing exception caught:", error);

            modalContent.innerHTML = '';
            const closeBtnSec = document.createElement('button');
            closeBtnSec.id = 'close-modal-btn';
            closeBtnSec.className = 'close-btn';
            closeBtnSec.innerHTML = '&times;';

            const errContainer = document.createElement('div');
            errContainer.style.cssText = 'text-align: center; padding: 2rem 0; display: flex; flex-direction: column; gap: 1rem; align-items: center;';

            const errIcon = document.createElement('div');
            errIcon.style.cssText = 'font-size: 2.5rem; color: hsl(350, 70%, 50%);';
            errIcon.textContent = '⚡';

            const errTitle = document.createElement('h3');
            errTitle.className = 'modal-title';
            errTitle.textContent = 'Local File Restriction';

            const errSubtitle = document.createElement('p');
            errSubtitle.className = 'modal-subtitle';
            errSubtitle.textContent = 'Browsers block silent background emails when running locally via double-click. Once this goes live on your repository, it will work without changing a single line.';

            errContainer.appendChild(errIcon);
            errContainer.appendChild(errTitle);
            errContainer.appendChild(errSubtitle);
            modalContent.appendChild(closeBtnSec);
            modalContent.appendChild(errContainer);
        }
    });
}