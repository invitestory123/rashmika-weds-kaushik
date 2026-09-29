/* Shared email RSVP behavior; no responses are sent or stored by the site. */
window.initWeddingRSVP = (form, config, names) => {
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
    <button type="submit" class="action rsvp-link" id="rsvp-submit-btn">SEND RSVP DIRECTLY</button>
    <p class="rsvp-help" role="status"></p>`;

  const name = form.querySelector('#rsvp-name');
  const attendance = form.querySelector('#rsvp-attendance');
  const count = form.querySelector('#rsvp-count');
  const kids = form.querySelector('#rsvp-kids');
  const meal = form.querySelector('#rsvp-meal');
  const allergies = form.querySelector('#rsvp-allergies');
  const stay = form.querySelector('#rsvp-stay');
  const party = form.querySelector('#rsvp-party');
  const submitBtn = form.querySelector('#rsvp-submit-btn');
  const help = form.querySelector('.rsvp-help');
  const email = String(config.email || '').trim();
  const validEmail = /^[^\s@<>?,;:%]+@[^\s@<>?,;:%]+\.[^\s@<>?,;:%]+$/.test(email);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
    ? `Your RSVP will be sent directly to the hosts at <strong>${email}</strong>.`
    : 'You’re welcome to fill in your details. Direct RSVP will be available once the host adds their address.';

  form.addEventListener('submit', async event => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your full name.');
    if (!form.reportValidity()) return;
    if (!validEmail) {
      help.textContent = 'The host’s RSVP email is not configured yet.';
      return;
    }

    const attending = attendance.value === 'yes';
    const guestName = name.value.trim();
    const guestCount = attending ? count.value : '0';
    const childrenPref = attending ? kids.value : 'N/A';
    const foodPref = attending ? meal.value : 'N/A';
    const dietaryAllergies = attending ? (allergies.value.trim() || 'None') : 'N/A';
    const stayPref = attending ? stay.value : 'N/A';

    let body = '';
    if (attending) {
      body = `Dear ${names},\n\n` +
        `Thank you for your kind invitation! We are delighted to celebrate with you.\n\n` +
        `• Guest Name: ${guestName}\n` +
        `• Attendance: Joyfully accepts\n` +
        `• Number of Guests: ${guestCount}\n` +
        `• Attending with children: ${childrenPref}\n` +
        `• Food Preference (Veg / Non-veg): ${foodPref}\n` +
        `• Allergies (if any): ${dietaryAllergies}\n` +
        `• Staying on 7th night: ${stayPref}\n\n` +
        `Looking forward to celebrating together!\n\n` +
        `With warm wishes,\n` +
        `${guestName}`;
    } else {
      body = `Dear ${names},\n\n` +
        `Thank you for your kind invitation. Regretfully, I will be unable to attend, but sending you both my heartfelt congratulations and warmest blessings.\n\n` +
        `• Guest Name: ${guestName}\n` +
        `• Attendance: Regretfully declines\n\n` +
        `With warm wishes,\n` +
        `${guestName}`;
    }

    const subject = `Wedding RSVP — ${guestName} (${attending ? 'Joyfully Accepts' : 'Regretfully Declines'})`;

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING RSVP...';
    help.textContent = 'Submitting your RSVP directly to the hosts...';

    const payload = {
      "Guest Name": guestName,
      "Attendance": attending ? "Joyfully accepts" : "Regretfully declines",
      "Number of Guests": guestCount,
      "Attending with Children": childrenPref,
      "Food Preference": foodPref,
      "Allergies": dietaryAllergies,
      "Staying on 7th Night": stayPref,
      "_subject": subject,
      "_template": "table",
      "_captcha": "false"
    };

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok || data.success === 'true' || data.success === true) {
        form.innerHTML = `
          <div class="rsvp-success-card">
            <div class="rsvp-success-badge" aria-hidden="true">✓</div>
            <h3 class="rsvp-success-title">Thank You, ${escape(guestName)}!</h3>
            <p class="rsvp-success-msg">Your RSVP has been sent directly to the hosts at <strong>${escape(email)}</strong>.</p>
            <p class="rsvp-success-note">${attending ? 'We look forward to celebrating together!' : 'Warmest wishes, thank you for letting us know.'}</p>
          </div>
        `;
        return;
      }
      throw new Error(data.message || 'Direct delivery error');
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SEND RSVP DIRECTLY';
      help.innerHTML = `
        <span style="display:block;margin-bottom:8px">Direct delivery was interrupted. You can send it directly via email app below:</span>
        <button type="button" class="action secondary" id="rsvp-fallback-btn" style="width:100%;margin-top:6px">Send via Email App</button>
      `;
      const fallbackBtn = form.querySelector('#rsvp-fallback-btn');
      if (fallbackBtn) {
        fallbackBtn.addEventListener('click', () => {
          window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
      }
    }
  });
};
