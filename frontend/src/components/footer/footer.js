import './footer.scss';
import footerTemplate from './footer.html';

export function renderFooter(target) {
  target.innerHTML = footerTemplate;
}