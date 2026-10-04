import { createPlayer } from '../../api';
import './registration.scss';
import { renderHeader } from '../../components/header/header';
import { renderFooter } from '../../components/footer/footer';

const headerRoot = document.querySelector('#header');
const footerRoot = document.querySelector('#footer');

if (headerRoot) {
  renderHeader(headerRoot);
}

if (footerRoot) {
  renderFooter(footerRoot);
}

const registrationForm = document.querySelector('#player-registration-form');
const registrationMessage = document.querySelector('#registration-message');

registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(registrationForm);

  const player = {
    name: formData.get('name'),
    role: formData.get('role'),
    country: formData.get('country'),
    basePrice: Number(formData.get('basePrice')),
  };

  try {
    const response = await createPlayer(player);

    registrationMessage.textContent = response.message;
    registrationForm.reset();
  } catch (error) {
    registrationMessage.textContent = error.message;
  }
});