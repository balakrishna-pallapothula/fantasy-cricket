import './landing.scss';
import { renderHeader } from '../../components/header/header';

const headerRoot = document.querySelector('#header');

if (headerRoot) {
  renderHeader(headerRoot);
}