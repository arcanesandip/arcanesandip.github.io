export function initContactModal() {
    const contactBtn = document.getElementById('nav-contact-btn');
    const modal = document.getElementById('contact-modal');
    const contactForm = document.getElementById('contact-form');
    const modalContent = document.querySelector('.modal-content');

    if (!contactBtn || !modal || !contactForm || !modalContent) return;

    // Cache the original pristine HTML structure so we can restore the form layout later
    if (!window.originalModalHTML) {
        window.originalModalHTML = modalContent.innerHTML;
    }

    // 1. OPEN MODAL INTERACTION
    contactBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add('is-active');
        modal.removeAttribute('inert');
        document.body.classList.add('no-scroll');
        document.getElementById('contact-name')?.focus();
    };

    // 2. CLOSE MODAL & RESTORE FORM LAYOUT
    const closeModal = () => {
        modal.classList.remove('is-active');
        modal.setAttribute('inert', '');
        document.body.classList.remove('no-scroll');
        
        // Wait for the CSS fade-out transition to complete before flipping the DOM nodes
        setTimeout(() => {
            modalContent.innerHTML = window.originalModalHTML;
            initContactModal(); // Re-bind event handlers to the brand new form elements
        }, 250);
        
        contactBtn.focus();
    };

    // Handle close button and background clicks
    modalContent.onclick = (e) => {
        if (e.target.id === 'close-modal-btn') closeModal();
    };

    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    document.onkeydown = (e) => {
        if (e.key === 'Escape' && !modal.hasAttribute('inert')) closeModal();
    };

    // 3. INTERCEPT AND SEND SILENTLY IN BACKGROUND
    contactForm.onsubmit = async (e) => {
        e.preventDefault(); // This is the magic line that stops Formspree's page from opening!
        
        const submitBtn = contactForm.querySelector('.form-submit-btn');
        const inputName = document.getElementById('contact-name').value;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "DISPATCHING...";
            submitBtn.style.opacity = "0.5";
        }

        try {
            // Send the form data in the background using the form's native action URL
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            });

            // Wipe out the inputs to show the custom verification message
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
            // CATCH EXCEPTION: This block will catch the local security drop when running file:///
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
            errSubtitle.textContent = 'Browsers block silent background emails when running locally via double-click. Once this goes live on your repository, it will work perfectly without changing a single line!';

            errContainer.appendChild(errIcon);
            errContainer.appendChild(errTitle);
            errContainer.appendChild(errSubtitle);
            modalContent.appendChild(closeBtnSec);
            modalContent.appendChild(errContainer);
        }
    };
}