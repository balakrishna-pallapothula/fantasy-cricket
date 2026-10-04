import './landing.scss';
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