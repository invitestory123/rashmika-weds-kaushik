/* Shared email RSVP behavior; no responses are sent or stored by the site. */
window.initWeddingRSVP = (form, config, names) => {
  const email = String(config.email || '').trim();
  const validEmail = /^[^\s@<>?,;:%]+@[^\s@<>?,;:%]+\.[^\s@<>?,;:%]+$/.test(email);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const renderForm = () => {
    form.innerHTML = `<label for="rsvp-name">Your full name</label>
      <input id="rsvp-name" name="guestName" autocomplete="name" maxlength="120" placeholder="First and last name" required>
      <label for="rsvp-attendance">Will you be joining us?</label>
      <select id="rsvp-attendance" name="attendance" required>
        <option value="">Please select your response</option>
        <option value="yes">Joyfully accepts</option>
        <option value="no">Regretfully declines</option>
      </select>
      <div id="rsvp-party" hidden>
        <label for="rsvp-count">Number of guests attending</label>
        <input id="rsvp-count" name="guestCount" type="number" min="1" max="100" step="1" value="1" disabled aria-describedby="rsvp-count-help">
        <small id="rsvp-count-help">Including yourself</small>

        <label for="rsvp-kids">Are you attending the celebrations with your children?</label>
        <select id="rsvp-kids" name="kids" disabled required>
          <option value="No">No</option>
          <option value="Yes, attending with children">Yes, attending with children</option>
        </select>

        <label for="rsvp-meal">Do you prefer veg or non veg?</label>
        <select id="rsvp-meal" name="meal" disabled required>
          <option value="Vegetarian">Vegetarian</option>
          <option value="Non-Vegetarian">Non-Vegetarian</option>
        </select>

        <label for="rsvp-allergies">Allergies if any</label>
        <input id="rsvp-allergies" name="allergies" type="text" maxlength="150" placeholder="None / specify allergies" disabled>

        <label for="rsvp-stay">Are you staying with us on 7th night?</label>
        <select id="rsvp-stay" name="stay" disabled required>
          <option value="Yes, staying with you on 7th night">Yes, staying with you on 7th night</option>
          <option value="No, not staying overnight">No, not staying overnight</option>
        </select>
      </div>
      <button type="submit" class="action rsvp-link" id="rsvp-submit-btn">PREPARE RSVP EMAIL</button>
      <p class="rsvp-help" role="status"></p>`;

    const name = form.querySelector('#rsvp-name');
    const attendance = form.querySelector('#rsvp-attendance');
    const count = form.querySelector('#rsvp-count');
    const kids = form.querySelector('#rsvp-kids');
    const meal = form.querySelector('#rsvp-meal');
    const allergies = form.querySelector('#rsvp-allergies');
    const stay = form.querySelector('#rsvp-stay');
    const party = form.querySelector('#rsvp-party');
    const help = form.querySelector('.rsvp-help');

    const sync = () => {
      const attending = attendance.value === 'yes';
      party.hidden = !attending;
      [count, kids, meal, allergies, stay].forEach(el => {
        if (el) el.disabled = !attending;
      });
      count.required = attending;
      kids.required = attending;
      meal.required = attending;
      stay.required = attending;
    };

    attendance.addEventListener('change', sync);
    name.addEventListener('input', () => name.setCustomValidity(''));
    sync();

    help.innerHTML = validEmail
      ? `Your RSVP will be addressed to <strong>${email}</strong>.<br><small style="display:block;margin-top:6px;opacity:.85">Click below to prepare your email response.</small>`
      : 'You’re welcome to fill in your details. Email RSVP will be available once the host adds their address.';

    form.addEventListener('submit', event => {
      event.preventDefault();
      name.setCustomValidity(name.value.trim() ? '' : 'Please enter your full name.');
      if (!form.reportValidity()) return;
      if (!validEmail) {
        help.textContent = 'The host’s RSVP email is not configured yet. Your reply has not been sent.';
        return;
      }

      const attending = attendance.value === 'yes';
      const guestName = name.value.trim();
      const guestCount = attending ? count.value : '0';
      const childrenPref = attending ? kids.value : 'N/A';
      const foodPref = attending ? meal.value : 'N/A';
      const dietaryAllergies = attending ? (allergies.value.trim() || 'None') : 'N/A';
      const stayPref = attending ? stay.value : 'N/A';

      const lines = [
        `Dear ${names},`,
        '',
        attending
          ? 'Thank you for your kind invitation! We are delighted to celebrate with you.'
          : 'Thank you for your kind invitation. Regretfully, I will be unable to attend, but sending you both my heartfelt congratulations and warmest blessings.',
        '',
        `- Guest Name: ${guestName}`,
        `- Attendance: ${attending ? 'Joyfully accepts' : 'Regretfully declines'}`,
        ...(attending ? [
          `- Number of Guests: ${guestCount}`,
          `- Attending with children: ${childrenPref}`,
          `- Food Preference (Veg / Non-veg): ${foodPref}`,
          `- Allergies (if any): ${dietaryAllergies}`,
          `- Staying on 7th night: ${stayPref}`
        ] : []),
        '',
        attending ? 'Looking forward to celebrating together!' : '',
        '',
        'With warm wishes,',
        guestName
      ];
      const bodyText = lines.join('\r\n');
      const subject = `Wedding RSVP — ${guestName} (${attending ? 'Joyfully Accepts' : 'Regretfully Declines'})`;

      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

      // Attempt to trigger mailto directly
      const tempLink = document.createElement('a');
      tempLink.href = mailtoUrl;
      tempLink.rel = 'noopener noreferrer';
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();

      // Show the RSVP Launch Panel so no one is ever stranded
      form.innerHTML = `
        <div class="rsvp-prepared-card">
          <span class="rsvp-prepared-badge">RSVP Ready</span>
          <h3 class="rsvp-prepared-title">Send Your RSVP</h3>
          <p class="rsvp-prepared-help">Choose your preferred way to send your response to <strong>${escape(email)}</strong>:</p>
          <div class="rsvp-action-btns">
            <a href="${escape(gmailUrl)}" target="_blank" rel="noopener noreferrer" class="rsvp-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              Open in Gmail (Web & App)
            </a>
            <a href="${escape(mailtoUrl)}" class="rsvp-action-btn secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Open Default Mail App
            </a>
            <button type="button" class="rsvp-action-btn outline" id="rsvp-copy-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy RSVP Message
            </button>
          </div>
          <span class="rsvp-toast" id="rsvp-toast" hidden>✓ Copied to clipboard! You can paste and send directly.</span>
          <details style="margin-top:14px;text-align:left">
            <summary style="cursor:pointer;font-size:13px;color:var(--accent);font-weight:600">View message preview</summary>
            <div class="rsvp-preview-box">${escape(bodyText)}</div>
          </details>
          <button type="button" class="reopen" id="rsvp-edit-btn" style="margin-top:16px;font-size:13px">Edit RSVP details</button>
        </div>
      `;

      const copyBtn = form.querySelector('#rsvp-copy-btn');
      const toast = form.querySelector('#rsvp-toast');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          const fullText = `To: ${email}\nSubject: ${subject}\n\n${bodyText}`;
          try {
            await navigator.clipboard.writeText(fullText);
            toast.hidden = false;
            setTimeout(() => { toast.hidden = true; }, 4000);
          } catch {
            const ta = document.createElement('textarea');
            ta.value = fullText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            toast.hidden = false;
            setTimeout(() => { toast.hidden = true; }, 4000);
          }
        });
      }

      const editBtn = form.querySelector('#rsvp-edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', renderForm);
      }
    });
  };

  renderForm();
};
