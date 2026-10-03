import './header.scss';
import headerTemplate from './header.html';

export function renderHeader(target) {
  target.innerHTML = headerTemplate;
}
