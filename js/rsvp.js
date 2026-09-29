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

      <label for="rsvp-stay">Are you staying with us on 7th Feb night?</label>
      <select id="rsvp-stay" name="stay" disabled required>
        <option value="Yes, staying on 7th Feb night">Yes, staying on 7th Feb night</option>
        <option value="No, not staying overnight">No, not staying overnight</option>
      </select>

      <label for="rsvp-kids">Are you attending the celebration with kid(s)?</label>
      <select id="rsvp-kids" name="kids" disabled required>
        <option value="No">No</option>
        <option value="Yes, attending with kid(s)">Yes, attending with kid(s)</option>
      </select>

      <label for="rsvp-meal">Do you prefer veg or non-veg?</label>
      <select id="rsvp-meal" name="meal" disabled required>
        <option value="Vegetarian">Vegetarian</option>
        <option value="Non-Vegetarian">Non-Vegetarian</option>
      </select>

      <label for="rsvp-allergies">Specify allergies (if any)</label>
      <input id="rsvp-allergies" name="allergies" type="text" maxlength="150" placeholder="e.g. None, nuts, dairy, gluten..." disabled>
      <small>Let us know if you have any dietary restrictions</small>
    </div>
    <button type="submit" class="action rsvp-link">Send RSVP via Email</button>
    <p class="rsvp-help" role="status"></p>`;

  const name = form.querySelector('#rsvp-name');
  const attendance = form.querySelector('#rsvp-attendance');
  const count = form.querySelector('#rsvp-count');
  const stay = form.querySelector('#rsvp-stay');
  const kids = form.querySelector('#rsvp-kids');
  const meal = form.querySelector('#rsvp-meal');
  const allergies = form.querySelector('#rsvp-allergies');
  const party = form.querySelector('#rsvp-party');
  const help = form.querySelector('.rsvp-help');
  const email = String(config.email || '').trim();
  const validEmail = /^[^\s@<>?,;:%]+@[^\s@<>?,;:%]+\.[^\s@<>?,;:%]+$/.test(email);

  const sync = () => {
    const attending = attendance.value === 'yes';
    party.hidden = !attending;
    [count, stay, kids, meal, allergies].forEach(el => {
      if (el) el.disabled = !attending;
    });
    count.required = attending;
    stay.required = attending;
    kids.required = attending;
    meal.required = attending;
  };

  attendance.addEventListener('change', sync);
  name.addEventListener('input', () => name.setCustomValidity(''));
  sync();

  help.innerHTML = validEmail
    ? `Your email app will open addressed to <strong>${email}</strong>.<br><small style="display:block;margin-top:6px;opacity:.85">Press Send in your email to submit. You can also write to us directly at <a href="mailto:${email}" style="text-decoration:underline">${email}</a>.</small>`
    : 'You’re welcome to fill in your details. Email RSVP will be available once the host adds their address.';

  form.addEventListener('submit', event => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your full name.');
    if (!form.reportValidity()) return;
    if (!validEmail) {
      help.textContent = 'The host’s RSVP email is not available yet. Your reply has not been sent.';
      return;
    }
    const attending = attendance.value === 'yes';
    let body = '';
    if (attending) {
      body = `Dear ${names},\n\n` +
        `Thank you for your kind invitation! We are delighted to celebrate with you.\n\n` +
        `• Guest Name: ${name.value.trim()}\n` +
        `• Attendance: Joyfully accepts\n` +
        `• Number of Guests: ${count.value}\n` +
        `• Staying on 7th Feb night: ${stay.value}\n` +
        `• Attending with kid(s): ${kids.value}\n` +
        `• Food Preference: ${meal.value}\n` +
        `• Allergies / Dietary Restrictions: ${allergies.value.trim() || 'None'}\n\n` +
        `Looking forward to celebrating together!\n\n` +
        `With warm wishes,\n` +
        `${name.value.trim()}`;
    } else {
      body = `Dear ${names},\n\n` +
        `Thank you for your kind invitation. Regretfully, I will be unable to attend, but sending you both my heartfelt congratulations and warmest blessings.\n\n` +
        `• Guest Name: ${name.value.trim()}\n` +
        `• Attendance: Regretfully declines\n\n` +
        `With warm wishes,\n` +
        `${name.value.trim()}`;
    }

    const subject = `Wedding RSVP — ${name.value.trim()} (${attending ? 'Joyfully Accepts' : 'Regretfully Declines'})`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    help.innerHTML = `Your RSVP email has been prepared for <strong>${email}</strong>.<br><small style="display:block;margin-top:6px">Please hit <strong>Send</strong> in your email app to complete your response.</small>`;
  });
};
