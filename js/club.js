import { validateClubName } from './validation.js';
import { createInitialClubState } from './store.js';

export function initClubForm(currentUser, onClubCreated) {
  const clubForm = document.getElementById('club-form');
  const errorBadge = document.getElementById('club-error');

  clubForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorBadge.classList.add('hidden');

    const clubName = document.getElementById('club-name-input').value;
    const selectedColor = document.querySelector('input[name="club-color"]:checked')?.value || '#3b82f6';

    const validation = validateClubName(clubName);
    if (!validation.valid) {
      errorBadge.innerText = validation.message;
      errorBadge.classList.remove('hidden');
      return;
    }

    // Initialize Save Data
    const newSave = createInitialClubState(currentUser.uid, clubName.trim(), selectedColor);
    onClubCreated(newSave);
  });
}
